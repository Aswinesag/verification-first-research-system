from retrieval.persistent_index import PersistentIndex

class Retriever:
    def __init__(self):
        self.embedder = EmbeddingModel()
        self.index = PersistentIndex()
        self.reranker = Reranker()

        self.web_tool = WebSearchTool()
        self.web_ingestor = WebIngestor(self.index)

    def retrieve(self, query, top_k=5):
        query_vec = self.embedder.encode([query])

        # Local search
        results = self.index.search(query_vec, top_k)

        # If weak → fetch web
        if not results or results[0]["score"] < 0.5:
            web_results = self.web_tool.search(query, k=3)
            self.web_ingestor.ingest(web_results)

            results = self.index.search(query_vec, top_k)

        return self.reranker.rerank(query, results)