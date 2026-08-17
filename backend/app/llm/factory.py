from typing import Optional
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from app.core.config import get_settings


def create_chat_model(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.7,
) -> BaseChatModel:
    """
    Factory to create LLM chat models. Supports Groq, Hugging Face, and OpenAI.
    
    Args:
        provider: The LLM provider ('groq', 'huggingface', 'openai'). Defaults to settings.LLM_PROVIDER.
        model: The specific model identifier.
        temperature: Sampling temperature.
        
    Returns:
        A BaseChatModel instance.
    """
    settings = get_settings()
    active_provider = provider or settings.LLM_PROVIDER
    
    if active_provider == "groq":
        return ChatOpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.GROQ_API_KEY,
            model=model or settings.GROQ_MODEL,
            temperature=temperature,
            streaming=True,
        )
    
    if active_provider == "huggingface":
        return ChatOpenAI(
            base_url=settings.HUGGINGFACE_BASE_URL,
            api_key=settings.HUGGINGFACE_API_KEY,
            model=model or settings.HUGGINGFACE_MODEL,
            temperature=temperature,
            streaming=True,
        )
    
    if active_provider == "openai":
        return ChatOpenAI(
            model=model or settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=temperature,
            streaming=True,
        )
        
    raise ValueError(f"Unsupported LLM provider: {active_provider}")


def get_chat_model(temperature: float = 0.7) -> BaseChatModel:
    """
    Get the default chat model from configured settings.
    
    Returns:
        A BaseChatModel instance.
    """
    return create_chat_model(temperature=temperature)
