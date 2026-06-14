import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import KnowledgeBase, Document, DocumentChunk
from app.services.document_service import document_service
from app.services.vector_service import vector_service
from app.config import settings

class KBService:
    def __init__(self, db: Session):
        self.db = db

    def create_kb(self, name: str, description: Optional[str] = None, 
                  chunk_size: int = 512, chunk_overlap: int = 50, 
                  embedding_model: str = "bge-large-zh") -> KnowledgeBase:
        existing = self.db.query(KnowledgeBase).filter(KnowledgeBase.name == name).first()
        if existing:
            raise ValueError(f"知识库名称 '{name}' 已存在")
        
        kb = KnowledgeBase(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            embedding_model=embedding_model
        )
        
        self.db.add(kb)
        self.db.commit()
        self.db.refresh(kb)
        
        vector_service.create_index(kb.id)
        return kb

    def get_kb(self, kb_id: str) -> Optional[KnowledgeBase]:
        return self.db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()

    def list_kbs(self, page: int = 1, page_size: int = 10) -> Tuple[List[KnowledgeBase], int]:
        query = self.db.query(KnowledgeBase)
        total = query.count()
        offset = (page - 1) * page_size
        kbs = query.order_by(KnowledgeBase.created_at.desc()).offset(offset).limit(page_size).all()
        return kbs, total

    def update_kb(self, kb_id: str, name: Optional[str] = None, description: Optional[str] = None,
                  chunk_size: Optional[int] = None, chunk_overlap: Optional[int] = None,
                  embedding_model: Optional[str] = None) -> KnowledgeBase:
        kb = self.get_kb(kb_id)
        if not kb:
            raise ValueError("知识库不存在")
        
        if name:
            existing = self.db.query(KnowledgeBase).filter(
                KnowledgeBase.name == name,
                KnowledgeBase.id != kb_id
            ).first()
            if existing:
                raise ValueError(f"知识库名称 '{name}' 已存在")
            kb.name = name
        
        if description is not None:
            kb.description = description
        if chunk_size is not None:
            kb.chunk_size = chunk_size
        if chunk_overlap is not None:
            kb.chunk_overlap = chunk_overlap
        if embedding_model:
            kb.embedding_model = embedding_model
        
        self.db.commit()
        self.db.refresh(kb)
        return kb

    def delete_kb(self, kb_id: str) -> bool:
        kb = self.get_kb(kb_id)
        if not kb:
            raise ValueError("知识库不存在")
        
        documents = self.db.query(Document).filter(Document.kb_id == kb_id).all()
        for doc in documents:
            if doc.file_path:
                document_service.delete_file(doc.file_path)
        
        vector_service.delete_index(kb_id)
        
        self.db.delete(kb)
        self.db.commit()
        return True

    def add_document(self, kb_id: str, file) -> Document:
        kb = self.get_kb(kb_id)
        if not kb:
            raise ValueError("知识库不存在")
        
        file_content = file.file.read()
        file_size = len(file_content)
        
        is_valid, error_msg = document_service.validate_file(file.filename, file_size, settings.MAX_FILE_SIZE)
        if not is_valid:
            raise ValueError(error_msg)
        
        file.file.seek(0)
        file_path = document_service.save_uploaded_file(file, settings.UPLOAD_DIR)
        
        doc = Document(
            id=str(uuid.uuid4()),
            kb_id=kb_id,
            file_name=file.filename,
            file_path=file_path,
            status="processing"
        )
        
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        
        try:
            text = document_service.extract_text(file_path)
            chunks = document_service.split_into_chunks(text, kb.chunk_size, kb.chunk_overlap)
            
            if chunks:
                chunk_ids = []
                for i, chunk_text in enumerate(chunks):
                    chunk = DocumentChunk(
                        id=str(uuid.uuid4()),
                        doc_id=doc.id,
                        chunk_index=i,
                        chunk_text=chunk_text,
                        metadata={"source": file.filename, "chunk_index": i}
                    )
                    self.db.add(chunk)
                    chunk_ids.append(chunk.id)
                
                self.db.commit()
                
                vectors = vector_service.generate_embeddings(chunks, kb.embedding_model)
                vector_service.add_vectors(
                    kb_id=kb_id,
                    vectors=vectors,
                    doc_ids=[doc.id] * len(chunks),
                    chunk_ids=chunk_ids,
                    chunk_texts=chunks
                )
                
                doc.chunk_count = len(chunks)
                doc.status = "completed"
            else:
                doc.status = "completed"
                doc.error_message = "文件内容为空"
            
        except Exception as e:
            doc.status = "failed"
            doc.error_message = str(e)
            document_service.delete_file(file_path)
        
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def get_document(self, doc_id: str) -> Optional[Document]:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def list_documents(self, kb_id: str, page: int = 1, page_size: int = 10) -> Tuple[List[Document], int]:
        query = self.db.query(Document).filter(Document.kb_id == kb_id)
        total = query.count()
        offset = (page - 1) * page_size
        docs = query.order_by(Document.created_at.desc()).offset(offset).limit(page_size).all()
        return docs, total

    def delete_document(self, doc_id: str) -> bool:
        doc = self.get_document(doc_id)
        if not doc:
            raise ValueError("文档不存在")
        
        kb_id = doc.kb_id
        chunk_ids = [chunk.id for chunk in doc.chunks]
        
        if doc.file_path:
            document_service.delete_file(doc.file_path)
        
        index_data = vector_service.get_index(kb_id)
        if index_data:
            new_doc_ids = []
            new_chunk_ids = []
            new_chunk_texts = []
            
            for i, cid in enumerate(index_data["chunk_ids"]):
                if cid not in chunk_ids:
                    new_doc_ids.append(index_data["doc_ids"][i])
                    new_chunk_ids.append(cid)
                    new_chunk_texts.append(index_data["chunk_texts"][i])
            
            dimension = index_data["dimension"]
            new_index = vector_service.create_index(kb_id, dimension)
            
            if new_chunk_texts:
                vectors = vector_service.generate_embeddings(new_chunk_texts, 
                    self.get_kb(kb_id).embedding_model)
                new_index.add(vectors)
            
            index_data["doc_ids"] = new_doc_ids
            index_data["chunk_ids"] = new_chunk_ids
            index_data["chunk_texts"] = new_chunk_texts
        
        self.db.delete(doc)
        self.db.commit()
        return True

    def search(self, kb_id: str, query: str, top_k: int = 5) -> List[dict]:
        kb = self.get_kb(kb_id)
        if not kb:
            raise ValueError("知识库不存在")
        
        query_vector = vector_service.generate_embeddings([query], kb.embedding_model)[0]
        results = vector_service.search(kb_id, query_vector, top_k)
        
        search_results = []
        for idx, similarity in results:
            chunk_info = vector_service.get_chunk_info(kb_id, idx)
            if chunk_info:
                doc = self.get_document(chunk_info["doc_id"])
                search_results.append({
                    "chunk_id": chunk_info["chunk_id"],
                    "doc_id": chunk_info["doc_id"],
                    "file_name": doc.file_name if doc else "Unknown",
                    "chunk_index": idx,
                    "chunk_text": chunk_info["chunk_text"],
                    "similarity": float(similarity),
                    "metadata": {"source": doc.file_name if doc else "Unknown"}
                })
        
        return search_results

    def get_kb_stats(self, kb_id: str) -> dict:
        kb = self.get_kb(kb_id)
        if not kb:
            raise ValueError("知识库不存在")
        
        doc_count = self.db.query(Document).filter(Document.kb_id == kb_id).count()
        chunk_count = self.db.query(DocumentChunk).join(Document).filter(
            Document.kb_id == kb_id
        ).count()
        
        index_data = vector_service.get_index(kb_id)
        indexed_count = index_data["index"].ntotal if index_data else 0
        
        return {
            "kb_id": kb_id,
            "name": kb.name,
            "document_count": doc_count,
            "chunk_count": chunk_count,
            "indexed_count": indexed_count,
            "embedding_model": kb.embedding_model,
            "chunk_size": kb.chunk_size
        }
