from ingestion.ingest_pipeline import IngestionPipeline

pipeline = IngestionPipeline()

result = pipeline.ingest_files([
    "data/ai_healthcare.txt"
])

print("INGEST RESULT:", result)