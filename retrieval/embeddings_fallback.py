import numpy as np
from typing import List, Optional
from utils.logging_utils import setup_logger, log_error, log_info
import hashlib

class SimpleEmbeddings:
    """Fallback embedding model using simple hash-based embeddings"""
    def __init__(self, dim=768):
        self.logger = setup_logger("simple_embeddings")
        self.dim = dim
        log_info(self.logger, "Using simple hash-based embeddings (fallback mode)")
    
    def encode(self, texts: List[str]) -> np.ndarray:
        try:
            embeddings = []
            for text in texts:
                # Create hash-based embedding
                hash_obj = hashlib.md5(text.encode())
                hash_hex = hash_obj.hexdigest()
                
                # Convert hash to vector
                vector = []
                for i in range(0, min(len(hash_hex), self.dim // 4), 2):
                    # Convert hex pairs to float values
                    hex_pair = hash_hex[i:i+2]
                    val = int(hex_pair, 16) / 255.0  # Normalize to 0-1
                    vector.extend([val, 1-val])  # Create pairs
                
                # Pad or truncate to desired dimension
                while len(vector) < self.dim:
                    vector.append(0.0)
                vector = vector[:self.dim]
                
                embeddings.append(vector)
            
            result = np.array(embeddings, dtype=np.float32)
            # Normalize embeddings
            norms = np.linalg.norm(result, axis=1, keepdims=True)
            norms[norms == 0] = 1  # Avoid division by zero
            result = result / norms
            
            log_info(self.logger, f"Generated embeddings for {len(texts)} texts")
            return result
            
        except Exception as e:
            log_error(self.logger, e, "Failed to generate embeddings")
            # Return zero embeddings as fallback
            return np.zeros((len(texts), self.dim), dtype=np.float32)

# Try to import sentence-transformers with proper error handling
sentence_transformers_available = False
try:
    import sentence_transformers
    sentence_transformers_available = True
except (ImportError, ValueError) as e:
    # ImportError: sentence-transformers not installed
    # ValueError: Keras compatibility issues
    sentence_transformers_available = False

if sentence_transformers_available:
    try:
        from sentence_transformers import SentenceTransformer
        
        class EmbeddingModel:
            def __init__(self, model_name="BAAI/bge-base-en-v1.5"):
                self.logger = setup_logger("embeddings")
                try:
                    self.model = SentenceTransformer(model_name)
                    self.use_simple = False
                    log_info(self.logger, f"Using sentence-transformers model: {model_name}")
                except Exception as e:
                    log_error(self.logger, e, f"Failed to load {model_name}, falling back to simple embeddings")
                    self.simple_model = SimpleEmbeddings()
                    self.use_simple = True
            
            def encode(self, texts):
                try:
                    if self.use_simple:
                        return self.simple_model.encode(texts)
                    else:
                        result = self.model.encode(texts, normalize_embeddings=True)
                        return result
                except Exception as e:
                    log_error(self.logger, e, "Encoding failed, trying simple embeddings")
                    if not self.use_simple:
                        self.simple_model = SimpleEmbeddings()
                        self.use_simple = True
                        return self.simple_model.encode(texts)
                    raise
    except Exception as e:
        # sentence-transformers available but failed to import
        log_error(setup_logger("embeddings"), e, "Failed to import sentence-transformers components")
        sentence_transformers_available = False

# Fallback when sentence-transformers is not available or failed
if not sentence_transformers_available:
    class EmbeddingModel:
        def __init__(self, model_name="BAAI/bge-base-en-v1.5"):
            self.logger = setup_logger("embeddings")
            self.simple_model = SimpleEmbeddings()
            log_info(self.logger, "sentence-transformers not available, using simple embeddings")
        
        def encode(self, texts):
            return self.simple_model.encode(texts)
