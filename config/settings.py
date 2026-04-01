import os
from dotenv import load_dotenv

# Force reload environment to get latest values
load_dotenv(override=True)


class Settings:
    # API Keys
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    SERPER_API_KEY = os.getenv("SERPER_API_KEY")

    # Model Settings
    GROQ_MODEL = os.getenv("GROQ_MODEL")
    HF_MODEL = os.getenv("HF_MODEL")

    # Cache Settings
    ENABLE_CACHE = os.getenv("ENABLE_CACHE", "true").lower() == "true"
    CACHE_TTL = int(os.getenv("CACHE_TTL", 3600))
    LLM_CACHE_SIZE = int(os.getenv("LLM_CACHE_SIZE", 1000))
    RETRIEVAL_CACHE_SIZE = int(os.getenv("RETRIEVAL_CACHE_SIZE", 5000))

    # Execution Settings
    MAX_EXECUTION_STEPS = int(os.getenv("MAX_EXECUTION_STEPS", 50))
    ENABLE_SELF_DEBATE = os.getenv("ENABLE_SELF_DEBATE", "true").lower() == "true"
    DEBATE_ROUNDS = int(os.getenv("DEBATE_ROUNDS", 2))
    
    # Web Search Settings
    ENABLE_WEB_SEARCH = os.getenv("ENABLE_WEB_SEARCH", "true").lower() == "true"
    WEB_TOP_K = int(os.getenv("WEB_TOP_K", 5))
    WEB_SEARCH_TIMEOUT = int(os.getenv("WEB_SEARCH_TIMEOUT", 30))
    WEB_SCRAPING_TIMEOUT = int(os.getenv("WEB_SCRAPING_TIMEOUT", 10))

    # Retry Settings
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", 3))
    RETRY_DELAY = float(os.getenv("RETRY_DELAY", 1.0))
    RETRY_BACKOFF_FACTOR = float(os.getenv("RETRY_BACKOFF_FACTOR", 2.0))
    MAX_RETRY_DELAY = float(os.getenv("MAX_RETRY_DELAY", 60.0))

    # Uncertainty Weights
    EVIDENCE_WEIGHT = float(os.getenv("EVIDENCE_WEIGHT", 0.4))
    REASONING_WEIGHT = float(os.getenv("REASONING_WEIGHT", 0.3))
    SOURCE_DIVERSITY_WEIGHT = float(os.getenv("SOURCE_DIVERSITY_WEIGHT", 0.2))
    CONTRADICTION_PENALTY_WEIGHT = float(os.getenv("CONTRADICTION_PENALTY_WEIGHT", 0.3))

    # Memory Settings
    MAX_INDEX_SIZE = int(os.getenv("MAX_INDEX_SIZE", 100000))
    ENABLE_MEMORY_PRUNING = os.getenv("ENABLE_MEMORY_PRUNING", "false").lower() == "true"
    PRUNING_THRESHOLD = float(os.getenv("PRUNING_THRESHOLD", 0.8))

    # API Settings
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", 8000))
    API_TIMEOUT = int(os.getenv("API_TIMEOUT", 300))
    ENABLE_RATE_LIMITING = os.getenv("ENABLE_RATE_LIMITING", "false").lower() == "true"
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", 10))
    RATE_LIMIT_PERIOD = int(os.getenv("RATE_LIMIT_PERIOD", 60))

    # Health Check Settings
    HEALTH_CHECK_INTERVAL = int(os.getenv("HEALTH_CHECK_INTERVAL", 30))
    ENABLE_METRICS = os.getenv("ENABLE_METRICS", "true").lower() == "true"
    METRICS_RETENTION_HOURS = int(os.getenv("METRICS_RETENTION_HOURS", 24))


settings = Settings()