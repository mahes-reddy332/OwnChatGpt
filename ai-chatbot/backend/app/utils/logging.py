"""Logging configuration for the application."""

import logging
import logging.config
import json
from pythonjsonlogger import jsonlogger
import sys

# Configure JSON logging
LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": jsonlogger.JsonFormatter,
        },
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "standard",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "DEBUG",
            "formatter": "json",
            "filename": "logs/app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
        },
    },
    "loggers": {
        "app": {
            "level": "DEBUG",
            "handlers": ["console", "file"],
            "propagate": False,
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["console", "file"],
    },
}


def setup_logging():
    """Set up logging configuration."""
    import os
    os.makedirs("logs", exist_ok=True)
    logging.config.dictConfig(LOG_CONFIG)
    return logging.getLogger(__name__)


# Monitoring utilities
class PerformanceMonitor:
    """Monitor and log performance metrics."""

    @staticmethod
    def log_llm_call(model: str, tokens_in: int, tokens_out: int, duration: float):
        """Log LLM API call metrics."""
        logger = logging.getLogger("app.llm_service")
        logger.info(
            "LLM_CALL",
            extra={
                "model": model,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "duration_seconds": duration,
            },
        )

    @staticmethod
    def log_rag_retrieval(query_length: int, chunks_retrieved: int, duration: float):
        """Log RAG retrieval metrics."""
        logger = logging.getLogger("app.rag_service")
        logger.info(
            "RAG_RETRIEVAL",
            extra={
                "query_length": query_length,
                "chunks_retrieved": chunks_retrieved,
                "duration_seconds": duration,
            },
        )

    @staticmethod
    def log_document_processing(filename: str, chunks: int, duration: float):
        """Log document processing metrics."""
        logger = logging.getLogger("app.file_service")
        logger.info(
            "DOCUMENT_PROCESSING",
            extra={
                "filename": filename,
                "chunks": chunks,
                "duration_seconds": duration,
            },
        )
