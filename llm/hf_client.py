from transformers import pipeline
from llm.base_llm import BaseLLM
import warnings
import os


class HFLLM(BaseLLM):
    def __init__(self, model="google/flan-t5-base"):
        try:
            # Disable TensorFlow warnings
            warnings.filterwarnings("ignore", category=UserWarning)
            os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
            
            self.pipe = pipeline("text2text-generation", model=model)
        except Exception as e:
            print(f"Warning: HF pipeline initialization failed: {e}")
            self.pipe = None
            self.model = model
    
    def generate(self, prompt: str, temperature: float = 0.2) -> str:
        if self.pipe is None:
            raise RuntimeError("HF pipeline not initialized due to dependency issues")
        
        result = self.pipe(prompt, max_length=512)
        return result[0]["generated_text"].strip()