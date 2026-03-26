import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    GROQ_MODEL = os.getenv("GROQ_MODEL")
    HF_MODEL = os.getenv("HF_MODEL")

    ENABLE_CACHE = os.getenv("ENABLE_CACHE", "true") == "true"
    CACHE_TTL = int(os.getenv("CACHE_TTL", 3600))

    MAX_EXECUTION_STEPS = int(os.getenv("MAX_EXECUTION_STEPS", 50))

    ENABLE_SELF_DEBATE = os.getenv("ENABLE_SELF_DEBATE", "true") == "true"
    DEBATE_ROUNDS = int(os.getenv("DEBATE_ROUNDS", 2))


settings = Settings()