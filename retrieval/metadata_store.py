import hashlib


class MetadataStore:
    def __init__(self):
        self.hashes = set()

    def is_duplicate(self, text):
        h = hashlib.md5(text.encode()).hexdigest()
        if h in self.hashes:
            return True
        self.hashes.add(h)
        return False