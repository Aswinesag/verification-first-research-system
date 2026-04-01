import os
from dotenv import load_dotenv

# Force reload environment to get latest values
load_dotenv(override=True)


class Settings:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    SERPER_API_KEY = os.getenv("SERPER_API_KEY")

    GROQ_MODEL = os.getenv("GROQ_MODEL")
    HF_MODEL = os.getenv("HF_MODEL")

    ENABLE_CACHE = os.getenv("ENABLE_CACHE", "true") == "true"
    CACHE_TTL = int(os.getenv("CACHE_TTL", 3600))

    MAX_EXECUTION_STEPS = int(os.getenv("MAX_EXECUTION_STEPS", 50))

    ENABLE_SELF_DEBATE = os.getenv("ENABLE_SELF_DEBATE", "true") == "true"
    DEBATE_ROUNDS = int(os.getenv("DEBATE_ROUNDS", 2))
    
    ENABLE_WEB_SEARCH = os.getenv("ENABLE_WEB_SEARCH", "true") == "true"
    WEB_TOP_K = int(os.getenv("WEB_TOP_K", 5))


settings = Settings()