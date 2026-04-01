from tools.web_scraper import WebScraper
from retrieval.chunking import chunk_text
from retrieval.embeddings import EmbeddingModel
from retrieval.metadata_store import MetadataStore


class WebIngestor:
    def __init__(self, index):
        self.embedder = EmbeddingModel()
        self.scraper = WebScraper()
        self.meta_store = MetadataStore()
        self.index = index

    def ingest(self, search_results):
        texts = []
        sources = []

        for r in search_results:
            full_text = self.scraper.fetch(r["link"])

            if not full_text:
                continue

            chunks = chunk_text(full_text)

            for c in chunks:
                if not self.meta_store.is_duplicate(c):
                    texts.append(c)
                    sources.append(r["link"])

        if not texts:
            return []

        embeddings = self.embedder.encode(texts)
        self.index.add(embeddings, texts, sources)

        return texts