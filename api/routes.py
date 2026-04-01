from fastapi import APIRouter
from ingestion.ingest_pipeline import IngestionPipeline

router = APIRouter()

@router.post("/ingest")
def ingest(files: list[str]):
    pipeline = IngestionPipeline()
    return pipeline.ingest_files(files)