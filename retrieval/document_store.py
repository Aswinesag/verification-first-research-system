from retrieval.chunking import chunk_text


class DocumentStore:
    def __init__(self):
        self.documents = []

    def add_document(self, text):
        chunks = chunk_text(text)
        self.documents.extend(chunks)

    def get_all(self):
        return self.documents