from sentence_transformers import CrossEncoder


class Reranker:
    def __init__(self, model="cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model = CrossEncoder(model)

    def rerank(self, query, docs):
        pairs = [(query, d["text"]) for d in docs]
        scores = self.model.predict(pairs)

        for i, d in enumerate(docs):
            d["rerank_score"] = float(scores[i])

        return sorted(docs, key=lambda x: x["rerank_score"], reverse=True)