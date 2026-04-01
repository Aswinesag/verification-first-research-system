import faiss
import numpy as np
import pickle
import os


class PersistentIndex:
    def __init__(self, dim=768, path="vector_store"):
        self.index_path = f"{path}.index"
        self.meta_path = f"{path}.meta"

        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            self.metadata = pickle.load(open(self.meta_path, "rb"))
        else:
            self.index = faiss.IndexFlatIP(dim)
            self.metadata = []

    def add(self, embeddings, texts, sources):
        self.index.add(np.array(embeddings))

        for t, s in zip(texts, sources):
            self.metadata.append({
                "text": t,
                "source": s
            })

        self.save()

    def search(self, query_vec, k=5):
        scores, indices = self.index.search(query_vec, k)

        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.metadata):
                item = self.metadata[idx]
                results.append({
                    "text": item["text"],
                    "source": item["source"],
                    "score": float(scores[0][i])
                })

        return results

    def save(self):
        faiss.write_index(self.index, self.index_path)
        pickle.dump(self.metadata, open(self.meta_path, "wb"))