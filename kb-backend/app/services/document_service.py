import os
import uuid
import re
import logging
from typing import List, Tuple
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.supported_extensions = ['.txt', '.pdf', '.docx']

    def validate_file(self, file_name: str, file_size: int, max_size: int) -> Tuple[bool, str]:
        _, ext = os.path.splitext(file_name.lower())
        if ext not in self.supported_extensions:
            return False, f"不支持的文件格式: {ext}。支持的格式: {', '.join(self.supported_extensions)}"
        
        if file_size > max_size:
            return False, f"文件大小超过限制 ({file_size/1024/1024:.2f} MB > {max_size/1024/1024:.2f} MB)"
        
        return True, ""

    def extract_text(self, file_path: str) -> str:
        _, ext = os.path.splitext(file_path.lower())
        
        try:
            if ext == '.txt':
                return self._read_txt(file_path)
            elif ext == '.pdf':
                return self._read_pdf(file_path)
            elif ext == '.docx':
                return self._read_docx(file_path)
            else:
                raise ValueError(f"不支持的文件格式: {ext}")
        except Exception as e:
            raise ValueError(f"文件解析失败: {str(e)}")

    def _read_txt(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

    def _read_pdf(self, file_path: str) -> str:
        text = ""
        with open(file_path, 'rb') as f:
            reader = PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()

    def _read_docx(self, file_path: str) -> str:
        doc = DocxDocument(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n".join(paragraphs)

    def split_into_chunks(self, text: str, chunk_size: int = 512, chunk_overlap: int = 50) -> List[str]:
        if not text.strip():
            return []
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        chunks = text_splitter.split_text(text)
        return [chunk.strip() for chunk in chunks if chunk.strip()]

    def save_uploaded_file(self, file, upload_dir: str) -> str:
        os.makedirs(upload_dir, exist_ok=True)
        
        original_name = file.filename or 'unknown'
        safe_name = re.sub(r'[^a-zA-Z0-9.-]', '_', original_name)
        file_ext = os.path.splitext(safe_name)[1] if safe_name else '.txt'
        
        if file_ext not in self.supported_extensions:
            file_ext = '.txt'
        
        filename = f"{uuid.uuid4().hex[:16]}{file_ext}"
        file_path = os.path.join(upload_dir, filename)
        
        abs_path = os.path.abspath(file_path)
        if not abs_path.startswith(os.path.abspath(upload_dir)):
            raise ValueError("非法文件路径")
        
        with open(file_path, 'wb') as f:
            f.write(file.file.read())
        
        logger.info(f"文件上传成功: {original_name} -> {filename}")
        return file_path

    def delete_file(self, file_path: str):
        if os.path.exists(file_path):
            os.remove(file_path)

document_service = DocumentService()
