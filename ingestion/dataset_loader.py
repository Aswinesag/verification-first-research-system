from datasets import load_dataset
from retrieval.chunking import chunk_text


class DatasetLoader:
    def load_wikipedia(self, limit=100):
        ds = load_dataset("wikipedia", "20220301.en", split="train[:1%]")

        texts = []
        for item in ds.select(range(limit)):
            chunks = chunk_text(item["text"])
            texts.extend(chunks)

        return texts