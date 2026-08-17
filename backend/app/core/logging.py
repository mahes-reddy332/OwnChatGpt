import logging
import sys
from pythonjsonlogger.json import JsonFormatter

def setup_logging(log_level: str) -> logging.Logger:
    """
    Setup application logging with JSON formatting.
    
    Args:
        log_level (str): The logging level (e.g., 'INFO', 'DEBUG').
        
    Returns:
        logging.Logger: The configured logger instance.
    """
    logger = logging.getLogger("app")
    logger.setLevel(log_level.upper())
    
    # Avoid duplicate handlers if called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        
        # Use JSON formatter for structured logging
        formatter = JsonFormatter(
            '%(asctime)s %(levelname)s %(name)s %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger
