from utils.logging_utils_production import setup_logger, log_info, log_error
import numpy as np

class SimpleReranker:
    """Simple fallback reranker using keyword matching and length heuristics"""
    def __init__(self):
        self.logger = setup_logger("simple_reranker")
        log_info(self.logger, "Using simple keyword-based reranker (fallback mode)")
    
    def rerank(self, query, docs):
        try:
            if not docs:
                return []
            
            # Extract query keywords
            query_words = set(query.lower().split())
            
            scored_docs = []
            for doc in docs:
                doc_text = doc.get("text", "").lower()
                
                # Simple scoring based on keyword overlap
                doc_words = set(doc_text.split())
                overlap = len(query_words.intersection(doc_words))
                
                # Length penalty (prefer concise answers)
                length_penalty = min(len(doc_text) / 1000, 1.0)
                
                # Combined score
                score = (overlap / max(len(query_words), 1)) * (1 - length_penalty * 0.3)
                
                scored_doc = doc.copy()
                scored_doc["rerank_score"] = float(score)
                scored_docs.append(scored_doc)
            
            # Sort by score
            scored_docs.sort(key=lambda x: x["rerank_score"], reverse=True)
            
            log_info(self.logger, f"Reranked {len(docs)} documents")
            return scored_docs
            
        except Exception as e:
            log_error(self.logger, e, "Reranking failed")
            # Return original docs with default scores
            for doc in docs:
                doc["rerank_score"] = 0.5
            return docs

# Try to import sentence-transformers CrossEncoder with proper error handling
sentence_transformers_available = False
try:
    import sentence_transformers
    sentence_transformers_available = True
except (ImportError, ValueError) as e:
    sentence_transformers_available = False

if sentence_transformers_available:
    try:
        from sentence_transformers import CrossEncoder
        
        class Reranker:
            def __init__(self, model="cross-encoder/ms-marco-MiniLM-L-6-v2"):
                self.logger = setup_logger("reranker")
                try:
                    self.model = CrossEncoder(model)
                    self.use_simple = False
                    log_info(self.logger, f"Using CrossEncoder model: {model}")
                except Exception as e:
                    log_error(self.logger, e, f"Failed to load {model}, falling back to simple reranker")
                    self.simple_reranker = SimpleReranker()
                    self.use_simple = True
            
            def rerank(self, query, docs):
                try:
                    if self.use_simple:
                        return self.simple_reranker.rerank(query, docs)
                    else:
                        pairs = [(query, d["text"]) for d in docs]
                        scores = self.model.predict(pairs)
                        
                        for i, d in enumerate(docs):
                            d["rerank_score"] = float(scores[i])
                        
                        return sorted(docs, key=lambda x: x["rerank_score"], reverse=True)
                except Exception as e:
                    log_error(self.logger, e, "CrossEncoder reranking failed, trying simple reranker")
                    if not self.use_simple:
                        self.simple_reranker = SimpleReranker()
                        self.use_simple = True
                        return self.simple_reranker.rerank(query, docs)
                    raise
    except Exception as e:
        log_error(setup_logger("reranker"), e, "Failed to import CrossEncoder components")
        sentence_transformers_available = False

# Fallback when sentence-transformers is not available or failed
if not sentence_transformers_available:
    class Reranker:
        def __init__(self, model="cross-encoder/ms-marco-MiniLM-L-6-v2"):
            self.logger = setup_logger("reranker")
            self.simple_reranker = SimpleReranker()
            log_info(self.logger, "sentence-transformers not available, using simple reranker")
        
        def rerank(self, query, docs):
            return self.simple_reranker.rerank(query, docs)
