import faiss
import numpy as np
import pickle
import os


class FAISSIndex:
    def __init__(self, dim, path="faiss.index"):
        self.dim = dim
        self.path = path

        if os.path.exists(path):
            self.index = faiss.read_index(path)
            self.metadata = pickle.load(open(path + ".meta", "rb"))
        else:
            self.index = faiss.IndexFlatIP(dim)
            self.metadata = []

    def add(self, embeddings, docs):
        self.index.add(np.array(embeddings))
        self.metadata.extend(docs)

    def search(self, query_vec, k=5):
        scores, indices = self.index.search(query_vec, k)

        results = []
        for i, idx in enumerate(indices[0]):
            results.append({
                "text": self.metadata[idx],
                "score": float(scores[0][i])
            })
        return results

    def save(self):
        faiss.write_index(self.index, self.path)
        pickle.dump(self.metadata, open(self.path + ".meta", "wb"))