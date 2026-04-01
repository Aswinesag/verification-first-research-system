from ingestion.loaders import DocumentLoader
from ingestion.preprocessors import clean_text
from retrieval.chunking import chunk_text
from retrieval.retriever import Retriever


class IngestionPipeline:
    def __init__(self):
        self.loader = DocumentLoader()
        self.retriever = Retriever()

    def ingest_files(self, file_paths):
        raw_docs = self.loader.load_multiple(file_paths)

        all_chunks = []

        for doc in raw_docs:
            cleaned = clean_text(doc)
            chunks = chunk_text(cleaned)
            all_chunks.extend(chunks)

        self.retriever.index_documents(all_chunks)

        return {
            "documents": len(raw_docs),
            "chunks": len(all_chunks),
            "status": "indexed"
        }