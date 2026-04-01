from retrieval.chunking import chunk_text
from retrieval.embeddings import EmbeddingModel


class WebIngestor:
    def __init__(self, index):
        self.embedder = EmbeddingModel()
        self.index = index

    def ingest_search_results(self, results):
        texts = []

        for r in results:
            combined = f"{r['title']} {r['snippet']}"
            texts.append(combined)

        chunks = []
        for t in texts:
            chunks.extend(chunk_text(t))

        embeddings = self.embedder.encode(chunks)

        self.index.add(embeddings, chunks)

        return chunks