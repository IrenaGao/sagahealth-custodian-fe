import typing
import sys
import logging

from .conf import settings

LogLevel: typing.TypeAlias = str | int

def get_basic_formatter() -> logging.Formatter:
    return logging.Formatter(
        "[%(name)s:%(levelname)s](%(asctime)s):`%(message)s`",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

def get_basic_logger(name: str, level: LogLevel = settings.LOG_LEVEL) -> logging.Logger:
    """
    Creates and returns a basic logger with the specified name.

    Args:
        name (str): The name of the logger.

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(name)
    # logger.propagate = False  # Prevent log messages from being propagated to the root logger
    if not logger.hasHandlers():
        logger.setLevel(level)
        s_handler = logging.StreamHandler(sys.stdout)
        s_handler.setFormatter(get_basic_formatter())
        s_handler.setLevel(settings.log_stream_level)
        f_handler = logging.FileHandler(settings.log_base_path / f"{name}.log")
        f_handler.setFormatter(get_basic_formatter())
        logger.addHandler(s_handler)
        logger.addHandler(f_handler)

    return logger

