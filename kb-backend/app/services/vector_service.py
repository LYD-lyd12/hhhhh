import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Tuple, Optional
import os
import json

class VectorService:
    _instance = None
    _models = {}
    _indexes = {}
    _index_dir = "./vector_indexes"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorService, cls).__new__(cls)
            cls._instance._load_all_indexes()
        return cls._instance
    
    def _load_all_indexes(self):
        if not os.path.exists(self._index_dir):
            return
        for filename in os.listdir(self._index_dir):
            if filename.endswith('_index.faiss'):
                kb_id = filename.replace('_index.faiss', '')
                self.load_index(kb_id, self._index_dir)

    def get_embedding_model(self, model_name: str = "bge-large-zh"):
        if model_name not in self._models:
            try:
                self._models[model_name] = SentenceTransformer(model_name)
            except Exception as e:
                raise ValueError(f"Failed to load embedding model {model_name}: {str(e)}")
        return self._models[model_name]

    def generate_embeddings(self, texts: List[str], model_name: str = "bge-large-zh") -> np.ndarray:
        model = self.get_embedding_model(model_name)
        embeddings = model.encode(texts)
        return embeddings

    def create_index(self, kb_id: str, dimension: int = 1024):
        index = faiss.IndexFlatIP(dimension)
        self._indexes[kb_id] = {
            "index": index,
            "dimension": dimension,
            "doc_ids": [],
            "chunk_ids": [],
            "chunk_texts": []
        }
        return index

    def get_index(self, kb_id: str):
        if kb_id not in self._indexes:
            return None
        return self._indexes[kb_id]

    def add_vectors(self, kb_id: str, vectors: np.ndarray, doc_ids: List[str], chunk_ids: List[str], chunk_texts: List[str]):
        if kb_id not in self._indexes:
            dimension = vectors.shape[1] if len(vectors.shape) > 1 else 1024
            self.create_index(kb_id, dimension)
        
        index_data = self._indexes[kb_id]
        index_data["index"].add(vectors)
        index_data["doc_ids"].extend(doc_ids)
        index_data["chunk_ids"].extend(chunk_ids)
        index_data["chunk_texts"].extend(chunk_texts)

    def search(self, kb_id: str, query_vector: np.ndarray, top_k: int = 5) -> List[Tuple[int, float]]:
        index_data = self.get_index(kb_id)
        if not index_data:
            return []
        
        index = index_data["index"]
        if index.ntotal == 0:
            return []
        
        distances, indices = index.search(query_vector.reshape(1, -1), top_k)
        results = []
        for i in range(len(indices[0])):
            if indices[0][i] != -1:
                results.append((indices[0][i], distances[0][i]))
        return results

    def get_chunk_info(self, kb_id: str, index: int) -> Optional[dict]:
        index_data = self.get_index(kb_id)
        if not index_data or index >= len(index_data["chunk_ids"]):
            return None
        
        return {
            "doc_id": index_data["doc_ids"][index],
            "chunk_id": index_data["chunk_ids"][index],
            "chunk_text": index_data["chunk_texts"][index]
        }

    def delete_index(self, kb_id: str):
        if kb_id in self._indexes:
            del self._indexes[kb_id]

    def save_index(self, kb_id: str, save_path: str):
        index_data = self.get_index(kb_id)
        if not index_data:
            return False
        
        os.makedirs(save_path, exist_ok=True)
        
        index_file = os.path.join(save_path, f"{kb_id}_index.faiss")
        faiss.write_index(index_data["index"], index_file)
        
        metadata_file = os.path.join(save_path, f"{kb_id}_metadata.json")
        metadata = {
            "doc_ids": index_data["doc_ids"],
            "chunk_ids": index_data["chunk_ids"],
            "chunk_texts": index_data["chunk_texts"],
            "dimension": index_data["dimension"]
        }
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False)
        
        return True

    def load_index(self, kb_id: str, save_path: str) -> bool:
        index_file = os.path.join(save_path, f"{kb_id}_index.faiss")
        metadata_file = os.path.join(save_path, f"{kb_id}_metadata.json")
        
        if not os.path.exists(index_file) or not os.path.exists(metadata_file):
            return False
        
        try:
            index = faiss.read_index(index_file)
            
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            
            self._indexes[kb_id] = {
                "index": index,
                "dimension": metadata["dimension"],
                "doc_ids": metadata["doc_ids"],
                "chunk_ids": metadata["chunk_ids"],
                "chunk_texts": metadata["chunk_texts"]
            }
            return True
        except Exception as e:
            print(f"Failed to load index {kb_id}: {e}")
            return False

vector_service = VectorService()
