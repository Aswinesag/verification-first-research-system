from llm.cache import LLMCache
from config.settings import settings


class LLMRouter:
    def __init__(self, primary_llm, fallback_llm=None):
        self.primary = primary_llm
        self.fallback = fallback_llm
        self.cache = LLMCache(settings.CACHE_TTL) if settings.ENABLE_CACHE else None

    def generate(self, prompt: str):
        if self.cache:
            cached = self.cache.get(prompt)
            if cached:
                return cached

        try:
            result = self.primary.generate(prompt)
        except Exception:
            if self.fallback:
                result = self.fallback.generate(prompt)
            else:
                raise

        if self.cache:
            self.cache.set(prompt, result)

        return result