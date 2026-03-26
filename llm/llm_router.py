class LLMRouter:
    def __init__(self, primary_llm, fallback_llm=None):
        self.primary = primary_llm
        self.fallback = fallback_llm

    def generate(self, prompt: str):
        try:
            return self.primary.generate(prompt)
        except Exception:
            if self.fallback:
                return self.fallback.generate(prompt)
            raise