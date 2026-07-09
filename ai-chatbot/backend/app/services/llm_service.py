"""
LLM Service Layer - Provider-agnostic interface for LLM APIs.

Supports: Google Gemini (primary), OpenAI (fallback), Groq (fast alternative).
Features: Streaming responses, automatic retry with exponential backoff, token estimation.
To add a new provider, create a class implementing BaseLLMProvider and register it.
"""

import logging
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Generator

from google import genai
from google.genai import types as genai_types
from openai import OpenAI, AuthenticationError as OpenAIAuthError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import settings

logger = logging.getLogger(__name__)


# ============================================================
# Base Provider Interface
# ============================================================
class BaseLLMProvider(ABC):
    """Abstract base class for all LLM providers."""

    @abstractmethod
    def chat(self, messages: list[dict], model: str | None = None,
             temperature: float = 0.7, max_tokens: int = 4096) -> dict:
        """Send messages and return {"response": str, "model": str, "usage": dict}."""

    @abstractmethod
    def stream_chat(self, messages: list[dict], model: str | None = None,
                    temperature: float = 0.7, max_tokens: int = 4096) -> Generator[str, None, None]:
        """Stream response chunks as they arrive."""

    @abstractmethod
    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for text."""

    @abstractmethod
    def list_models(self) -> list[dict]:
        """Return list of available models as [{"id", "name", "max_tokens"}]."""

    @abstractmethod
    def health_check(self) -> bool:
        """Return True if the API key is valid and the provider is reachable."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return provider identifier string."""


# ============================================================
# Google Gemini Provider (FREE tier) — uses new google-genai SDK
# ============================================================
class GeminiProvider(BaseLLMProvider):
    DEFAULT_MODEL = "gemini-2.0-flash"

    def __init__(self, api_key: str):
        self._client = genai.Client(api_key=api_key)

    @property
    def provider_name(self) -> str:
        return "gemini"

    def estimate_tokens(self, text: str) -> int:
        """Estimate tokens at ~4 chars per token."""
        return max(1, len(text) // 4)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError, RuntimeError)),
    )
    def chat(self, messages: list[dict], model: str | None = None,
             temperature: float = 0.7, max_tokens: int = 4096) -> dict:
        model_name = model or self.DEFAULT_MODEL

        # Convert messages to Gemini format
        system_instruction = None
        contents = []
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                system_instruction = content
            elif role == "user":
                contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text=content)]))
            elif role == "assistant":
                contents.append(genai_types.Content(role="model", parts=[genai_types.Part(text=content)]))

        config = genai_types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_instruction,
        )

        response = self._client.models.generate_content(
            model=model_name,
            contents=contents,
            config=config,
        )

        text = response.text or ""
        usage = {}
        if response.usage_metadata:
            um = response.usage_metadata
            usage = {
                "prompt_tokens": getattr(um, "prompt_token_count", 0) or 0,
                "completion_tokens": getattr(um, "candidates_token_count", 0) or 0,
                "total_tokens": getattr(um, "total_token_count", 0) or 0,
            }

        return {"response": text, "model": model_name, "usage": usage}

    def stream_chat(self, messages: list[dict], model: str | None = None,
                    temperature: float = 0.7, max_tokens: int = 4096) -> Generator[str, None, None]:
        """Stream response from Gemini."""
        model_name = model or self.DEFAULT_MODEL

        system_instruction = None
        contents = []
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                system_instruction = content
            elif role == "user":
                contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text=content)]))
            elif role == "assistant":
                contents.append(genai_types.Content(role="model", parts=[genai_types.Part(text=content)]))

        config = genai_types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_instruction,
        )

        try:
            with self._client.models.generate_content_stream(
                model=model_name,
                contents=contents,
                config=config,
            ) as stream:
                for chunk in stream:
                    if chunk.text:
                        yield chunk.text
        except Exception as e:
            logger.error(f"Gemini streaming failed: {e}")
            raise

    def list_models(self) -> list[dict]:
        return [
            {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "max_tokens": 8192},
            {"id": "gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash Lite", "max_tokens": 8192},
            {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "max_tokens": 8192},
            {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "max_tokens": 8192},
        ]

    def health_check(self) -> bool:
        try:
            response = self._client.models.generate_content(
                model="gemini-2.0-flash",
                contents="hi",
                config=genai_types.GenerateContentConfig(max_output_tokens=5),
            )
            return bool(response.text)
        except Exception as e:
            logger.warning(f"Gemini health check failed: {e}")
            return False


# ============================================================
# OpenAI Provider
# ============================================================
class OpenAIProvider(BaseLLMProvider):
    DEFAULT_MODEL = "gpt-4o-mini"

    def __init__(self, api_key: str):
        self._client = OpenAI(api_key=api_key)

    @property
    def provider_name(self) -> str:
        return "openai"

    def estimate_tokens(self, text: str) -> int:
        """Estimate tokens for OpenAI models (~1.3 chars per token)."""
        return max(1, int(len(text) / 3.5))

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError, RuntimeError)),
    )
    def chat(self, messages: list[dict], model: str | None = None,
             temperature: float = 0.7, max_tokens: int = 4096) -> dict:
        model_name = model or self.DEFAULT_MODEL
        response = self._client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        choice = response.choices[0]
        usage = {}
        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        return {"response": choice.message.content, "model": model_name, "usage": usage}

    def stream_chat(self, messages: list[dict], model: str | None = None,
                    temperature: float = 0.7, max_tokens: int = 4096) -> Generator[str, None, None]:
        """Stream response from OpenAI."""
        model_name = model or self.DEFAULT_MODEL
        stream = self._client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        try:
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI streaming failed: {e}")
            raise

    def list_models(self) -> list[dict]:
        return [
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "max_tokens": 16384},
            {"id": "gpt-4o", "name": "GPT-4o", "max_tokens": 4096},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "max_tokens": 4096},
        ]

    def health_check(self) -> bool:
        try:
            self._client.models.list()
            return True
        except OpenAIAuthError:
            return False
        except Exception as e:
            logger.warning(f"OpenAI health check failed: {e}")
            return False


# ============================================================
# Groq Provider — OpenAI-compatible API with ultra-fast inference
# ============================================================
class GroqProvider(BaseLLMProvider):
    DEFAULT_MODEL = "llama-3.3-70b-versatile"

    def __init__(self, api_key: str):
        self._client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

    @property
    def provider_name(self) -> str:
        return "groq"

    def estimate_tokens(self, text: str) -> int:
        """Estimate tokens for Groq/Llama models."""
        return max(1, len(text) // 4)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_type((ConnectionError, TimeoutError, RuntimeError)),
    )
    def chat(self, messages: list[dict], model: str | None = None,
             temperature: float = 0.7, max_tokens: int = 4096) -> dict:
        model_name = model or self.DEFAULT_MODEL
        response = self._client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        choice = response.choices[0]
        usage = {}
        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        return {"response": choice.message.content, "model": model_name, "usage": usage}

    def stream_chat(self, messages: list[dict], model: str | None = None,
                    temperature: float = 0.7, max_tokens: int = 4096) -> Generator[str, None, None]:
        """Stream response from Groq."""
        model_name = model or self.DEFAULT_MODEL
        stream = self._client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        try:
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"Groq streaming failed: {e}")
            raise

    def list_models(self) -> list[dict]:
        return [
            {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B", "max_tokens": 32768},
            {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B Instant", "max_tokens": 8192},
            {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B", "max_tokens": 32768},
            {"id": "gemma2-9b-it", "name": "Gemma 2 9B", "max_tokens": 8192},
        ]

    def health_check(self) -> bool:
        try:
            self._client.models.list()
            return True
        except OpenAIAuthError:
            return False
        except Exception as e:
            logger.warning(f"Groq health check failed: {e}")
            return False


# ============================================================
# LLM Router — picks primary provider, falls back if needed
# ============================================================
class LLMRouter:
    """Routes requests to the configured LLM provider with fallback support."""

    def __init__(self):
        self._providers: dict[str, BaseLLMProvider] = {}
        self._primary: str = settings.llm_provider
        self._init_providers()

    def _init_providers(self):
        # Register available providers
        if settings.gemini_api_key:
            self._providers["gemini"] = GeminiProvider(settings.gemini_api_key)
            logger.info("Gemini provider registered")

        if settings.openai_api_key:
            self._providers["openai"] = OpenAIProvider(settings.openai_api_key)
            logger.info("OpenAI provider registered")

        if settings.groq_api_key:
            self._providers["groq"] = GroqProvider(settings.groq_api_key)
            logger.info("Groq provider registered")

        if not self._providers:
            raise RuntimeError(
                "No LLM provider configured. Set at least GEMINI_API_KEY in .env"
            )

        # Validate primary exists
        if self._primary not in self._providers:
            self._primary = next(iter(self._providers))
            logger.warning(f"Primary provider not available, falling back to {self._primary}")

    @property
    def primary_provider(self) -> BaseLLMProvider:
        return self._providers[self._primary]

    @property
    def provider_name(self) -> str:
        return self._primary

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=5),
        retry=retry_if_exception_type((RuntimeError, ConnectionError)),
    )
    def chat(self, messages: list[dict], model: str | None = None,
             temperature: float = 0.7, max_tokens: int = 4096) -> dict:
        """Try primary provider, fall back to others on failure."""
        errors = []

        # Try primary first
        try:
            result = self._providers[self._primary].chat(
                messages, model, temperature, max_tokens
            )
            result["provider"] = self._primary
            return result
        except Exception as e:
            logger.error(f"Primary provider ({self._primary}) failed: {e}")
            errors.append(f"{self._primary}: {e}")

        # Try fallbacks
        for name, provider in self._providers.items():
            if name == self._primary:
                continue
            try:
                logger.info(f"Falling back to {name}")
                result = provider.chat(messages, None, temperature, max_tokens)
                result["provider"] = name
                return result
            except Exception as e:
                logger.error(f"Fallback provider ({name}) failed: {e}")
                errors.append(f"{name}: {e}")

        raise RuntimeError(f"All LLM providers failed: {'; '.join(errors)}")

    def stream_chat(self, messages: list[dict], model: str | None = None,
                    temperature: float = 0.7, max_tokens: int = 4096) -> Generator[str, None, None]:
        """Stream response from primary provider with fallback."""
        try:
            yield from self._providers[self._primary].stream_chat(
                messages, model, temperature, max_tokens
            )
        except Exception as e:
            logger.error(f"Primary provider streaming failed: {e}")
            # Fall back to non-streaming
            logger.info("Falling back to non-streaming response")
            result = self.chat(messages, model, temperature, max_tokens)
            # Yield response as chunks
            response = result.get("response", "")
            chunk_size = 10
            for i in range(0, len(response), chunk_size):
                yield response[i:i+chunk_size]

    def estimate_tokens(self, text: str) -> int:
        """Estimate token count using primary provider."""
        try:
            return self.primary_provider.estimate_tokens(text)
        except Exception as e:
            logger.warning(f"Token estimation failed: {e}")
            return max(1, len(text) // 4)

    def list_models(self) -> list[dict]:
        return self.primary_provider.list_models()

    def health_check(self) -> bool:
        return self.primary_provider.health_check()


# Singleton instance
llm_router = LLMRouter()
