from tools.web_search_tool import WebSearchTool
from retrieval.web_ingestor import WebIngestor
from config.settings import settings


class Retriever:
    def __init__(self):
        self.embedder = EmbeddingModel()
        self.index = FAISSIndex(dim=768)
        self.reranker = Reranker()

        self.web_enabled = os.getenv("ENABLE_WEB_SEARCH", "true") == "true"
        self.web_tool = WebSearchTool() if self.web_enabled else None
        self.web_ingestor = WebIngestor(self.index) if self.web_enabled else None

    def retrieve(self, query, top_k=5):
        # -------------------------
        # LOCAL SEARCH
        # -------------------------
        query_vec = self.embedder.encode([query])
        local_results = self.index.search(query_vec, top_k)

        # -------------------------
        # WEB SEARCH
        # -------------------------
        if self.web_enabled:
            web_results = self.web_tool.search(query, k=top_k)
            self.web_ingestor.ingest_search_results(web_results)

            # search again with enriched index
            local_results = self.index.search(query_vec, top_k)

        # -------------------------
        # RERANK
        # -------------------------
        return self.reranker.rerank(query, local_results)