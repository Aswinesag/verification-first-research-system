import numpy as np
from retrieval.embeddings import EmbeddingModel
from retrieval.faiss_index import FAISSIndex
from retrieval.reranker import Reranker


class Retriever:
    def __init__(self):
        self.embedder = EmbeddingModel()
        self.index = FAISSIndex(dim=768)
        self.reranker = Reranker()

    def index_documents(self, docs):
        embeddings = self.embedder.encode(docs)
        self.index.add(embeddings, docs)
        self.index.save()

    def retrieve(self, query, top_k=5):
        query_vec = self.embedder.encode([query])
        results = self.index.search(query_vec, top_k)

        reranked = self.reranker.rerank(query, results)

        return reranked