from transformers import pipeline
from llm.base_llm import BaseLLM


class HFLLM(BaseLLM):
    def __init__(self, model="google/flan-t5-base"):
        self.pipe = pipeline("text2text-generation", model=model)

    def generate(self, prompt: str, temperature: float = 0.2) -> str:
        result = self.pipe(prompt, max_length=512)
        return result[0]["generated_text"].strip()