import faiss
import numpy as np
import pickle
import os
from utils.logging_utils import setup_logger, log_error, log_info
from utils.retry_utils import retry

class PersistentIndex:
    def __init__(self, dim=768, path="vector_store"):
        self.logger = setup_logger("persistent_index")
        self.index_path = f"{path}.index"
        self.meta_path = f"{path}.meta"
        self.dim = dim

        try:
            if os.path.exists(self.index_path) and os.path.exists(self.meta_path):
                log_info(self.logger, "Loading existing index")
                self.index = faiss.read_index(self.index_path)
                with open(self.meta_path, "rb") as f:
                    self.metadata = pickle.load(f)
                log_info(self.logger, f"Loaded {len(self.metadata)} documents")
            else:
                log_info(self.logger, "Creating new index")
                self.index = faiss.IndexFlatIP(dim)
                self.metadata = []
        except Exception as e:
            log_error(self.logger, e, "Failed to initialize index")
            # Fallback to new index
            self.index = faiss.IndexFlatIP(dim)
            self.metadata = []

    @retry(max_attempts=3, delay=1.0)
    def add(self, embeddings, texts, sources):
        try:
            if len(embeddings) == 0 or len(texts) == 0:
                log_error(self.logger, ValueError("Empty embeddings or texts"), "Add operation")
                return
            
            # Validate dimensions
            if embeddings.shape[1] != self.dim:
                raise ValueError(f"Embedding dimension mismatch: expected {self.dim}, got {embeddings.shape[1]}")
            
            # Normalize embeddings for inner product
            embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
            
            self.index.add(np.array(embeddings, dtype=np.float32))

            for t, s in zip(texts, sources):
                self.metadata.append({
                    "text": t,
                    "source": s
                })

            self.save()
            log_info(self.logger, f"Added {len(texts)} documents to index")
            
        except Exception as e:
            log_error(self.logger, e, "Failed to add documents to index")
            raise

    @retry(max_attempts=3, delay=0.5)
    def search(self, query_vec, k=5):
        try:
            if self.index.ntotal == 0:
                log_info(self.logger, "Index is empty, returning empty results")
                return []
            
            # Normalize query vector
            query_vec = query_vec / np.linalg.norm(query_vec, axis=1, keepdims=True)
            
            scores, indices = self.index.search(query_vec.astype(np.float32), min(k, self.index.ntotal))

            results = []
            for i, idx in enumerate(indices[0]):
                if idx >= 0 and idx < len(self.metadata):
                    item = self.metadata[idx]
                    results.append({
                        "text": item["text"],
                        "source": item["source"],
                        "score": float(scores[0][i])
                    })

            log_info(self.logger, f"Search returned {len(results)} results")
            return results
            
        except Exception as e:
            log_error(self.logger, e, "Search failed")
            return []

    def save(self):
        try:
            faiss.write_index(self.index, self.index_path)
            with open(self.meta_path, "wb") as f:
                pickle.dump(self.metadata, f)
            log_info(self.logger, "Index saved successfully")
        except Exception as e:
            log_error(self.logger, e, "Failed to save index")
            raise