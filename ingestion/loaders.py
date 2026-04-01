from typing import List


class DocumentLoader:
    def load_text(self, file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def load_multiple(self, paths: List[str]) -> List[str]:
        return [self.load_text(p) for p in paths]