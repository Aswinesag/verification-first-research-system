from retrieval.persistent_index import PersistentIndex
from retrieval.embeddings_fallback import EmbeddingModel
from retrieval.reranker_fallback import Reranker
from tools.web_search_tool import WebSearchTool
from retrieval.web_ingestor import WebIngestor
from utils.logging_utils import setup_logger, log_error, log_info
from utils.retry_utils import retry
import numpy as np

class Retriever:
    def __init__(self):
        self.logger = setup_logger("retriever")
        try:
            self.embedder = EmbeddingModel()
            self.index = PersistentIndex()
            self.reranker = Reranker()
            self.web_tool = WebSearchTool()
            self.web_ingestor = WebIngestor(self.index)
            log_info(self.logger, "Retriever initialized successfully")
        except Exception as e:
            log_error(self.logger, e, "Failed to initialize retriever")
            raise
    
    @retry(max_attempts=3, delay=1.0)
    def retrieve(self, query, top_k=5):
        try:
            log_info(self.logger, f"Starting retrieval for query: {query[:100]}...")
            
            # Encode query
            query_vec = self.embedder.encode([query])
            if query_vec is None or len(query_vec) == 0:
                raise ValueError("Failed to encode query")

            # Local search
            results = self.index.search(query_vec, top_k)
            log_info(self.logger, f"Local search returned {len(results)} results")

            # If weak results → fetch web
            if not results or (results and results[0].get("score", 0) < 0.5):
                log_info(self.logger, "Weak local results, fetching from web")
                try:
                    web_results = self.web_tool.search(query, k=3)
                    if web_results:
                        self.web_ingestor.ingest(web_results)
                        # Re-search after web ingestion
                        results = self.index.search(query_vec, top_k)
                        log_info(self.logger, f"After web ingestion: {len(results)} results")
                except Exception as e:
                    log_error(self.logger, e, "Web search failed, using local results only")

            # Rerank results
            if results:
                results = self.reranker.rerank(query, results)
                log_info(self.logger, f"Final results after reranking: {len(results)}")
            
            return results[:top_k] if results else []
            
        except Exception as e:
            log_error(self.logger, e, f"Retrieval failed for query: {query[:50]}...")
            return []