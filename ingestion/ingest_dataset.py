from ingestion.dataset_loader import DatasetLoader
from retrieval.retriever import Retriever


def run_dataset_ingestion():
    print("🚀 Starting dataset ingestion...")

    loader = DatasetLoader()
    retriever = Retriever()

    # Load dataset
    wiki_chunks = loader.load_wikipedia(limit=50)

    print(f"Loaded {len(wiki_chunks)} chunks")

    # Index into persistent store
    retriever.index.add(
        retriever.embedder.encode(wiki_chunks),
        wiki_chunks,
        ["wikipedia"] * len(wiki_chunks)
    )

    print("✅ Dataset ingestion complete!")


if __name__ == "__main__":
    run_dataset_ingestion()