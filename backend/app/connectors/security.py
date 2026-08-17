import os
import re
import json
import base64
import socket
import ipaddress
import hashlib
import logging
from urllib.parse import urlparse
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import get_settings

logger = logging.getLogger("app.connectors.security")
settings = get_settings()

KEY_VERSION = "v1"


def get_encryption_key() -> bytes:
    """Derive a deterministic 32-byte AES-256 key from SECRET_KEY."""
    secret = settings.SECRET_KEY or "nexus_default_super_secret_key_change_in_production"
    return hashlib.sha256(secret.encode("utf-8")).digest()


def encrypt_credential(payload: dict) -> str:
    """
    Encrypt dictionary credential payload using AES-256-GCM.
    
    Format: v1:<nonce_b64>:<ciphertext_with_tag_b64>
    """
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # Standard 96-bit nonce for AES-GCM
    plaintext = json.dumps(payload).encode("utf-8")
    
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    nonce_b64 = base64.urlsafe_b64encode(nonce).decode("utf-8")
    ct_b64 = base64.urlsafe_b64encode(ciphertext).decode("utf-8")
    
    return f"{KEY_VERSION}:{nonce_b64}:{ct_b64}"


def decrypt_credential(encrypted_str: str) -> dict:
    """
    Decrypt AES-256-GCM credential string with version verification.
    """
    try:
        parts = encrypted_str.split(":")
        if len(parts) != 3 or parts[0] != KEY_VERSION:
            raise ValueError("Invalid credential format or unsupported key version")
        
        version, nonce_b64, ct_b64 = parts
        nonce = base64.urlsafe_b64decode(nonce_b64)
        ciphertext = base64.urlsafe_b64decode(ct_b64)
        
        key = get_encryption_key()
        aesgcm = AESGCM(key)
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return json.loads(decrypted_bytes.decode("utf-8"))
    except Exception as e:
        logger.error(f"Credential decryption failed: {e}")
        raise ValueError("Failed to decrypt connector credential") from e


def validate_mcp_url(url: str, is_development: bool | None = None) -> tuple[bool, str]:
    """
    Hardened SSRF & DNS-Rebinding validation for remote MCP server endpoints.
    
    Rules:
    - Must be a valid URL with http/https scheme.
    - In production, scheme must be https.
    - Resolves DNS and inspects all resolved IP addresses.
    - Rejects private, loopback, link-local, multicast, and reserved ranges in production.
    - Permits localhost only when is_development is True.
    """
    if is_development is None:
        is_development = getattr(settings, "ENVIRONMENT", "development") == "development"

    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return False, "Invalid URL format: missing scheme or hostname."

        scheme = parsed.scheme.lower()
        if scheme not in ("http", "https"):
            return False, f"Unsupported scheme '{scheme}'. Only HTTP and HTTPS are allowed."

        if not is_development and scheme != "https":
            return False, "Production policy requires HTTPS for all remote MCP endpoints."

        hostname = parsed.hostname
        if not hostname:
            return False, "Missing hostname in URL."

        # Allow localhost / loopback in explicit development mode
        if is_development and hostname.lower() in ("localhost", "127.0.0.1", "::1"):
            return True, "Valid development endpoint."

        # Resolve all DNS A and AAAA records
        try:
            addr_info = socket.getaddrinfo(hostname, None)
        except socket.gaierror as e:
            return False, f"DNS resolution failed for hostname '{hostname}': {e}"

        for entry in addr_info:
            ip_str = entry[4][0]
            try:
                ip_obj = ipaddress.ip_address(ip_str)
                if (
                    ip_obj.is_private
                    or ip_obj.is_loopback
                    or ip_obj.is_link_local
                    or ip_obj.is_multicast
                    or ip_obj.is_reserved
                    or ip_obj.is_unspecified
                ):
                    if not is_development:
                        return False, f"SSRF Protection: Hostname resolves to restricted private/internal IP ({ip_str})."
            except ValueError:
                return False, f"Invalid IP address resolved: {ip_str}"

        return True, "Valid remote endpoint."

    except Exception as e:
        return False, f"URL validation error: {str(e)}"


def enforce_transport_policy(transport: str, is_builtin: bool) -> tuple[bool, str]:
    """
    Enforce transport restrictions:
    - User custom connectors CANNOT use stdio (prevents arbitrary process execution on host).
    - Only system built-in connectors are permitted to use stdio.
    """
    if transport == "stdio" and not is_builtin:
        return False, "Security Policy: 'stdio' transport is restricted to trusted built-in system servers."
    if transport not in ("streamable_http", "sse", "stdio"):
        return False, f"Unsupported transport '{transport}'."
    return True, "Transport policy satisfied."


def generate_unique_tool_identifier(connector_id: str, tool_name: str) -> str:
    """
    Generate globally unique internal tool identifier:
    mcp__{connector_prefix}__{sanitized_tool_name}
    """
    clean_name = re.sub(r"[^a-zA-Z0-9_]", "_", tool_name).lower()
    prefix = connector_id.replace("-", "")[:8]
    return f"mcp__{prefix}__{clean_name}"
