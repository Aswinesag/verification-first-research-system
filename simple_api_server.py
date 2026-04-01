#!/usr/bin/env python3

"""
Simple API Server for Testing VARA Frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import time
import random
import asyncio
import re

app = FastAPI(title="VARA Test API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    request_id: Optional[str] = None

class QueryResponse(BaseModel):
    status: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    request_id: str
    elapsed_ms: float

@app.get("/")
async def root():
    return {
        "service": "VARA Test API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "llm": "available",
        "vector_db": "loaded",
        "web_search": "enabled",
        "uptime_seconds": time.time()
    }

@app.get("/metrics")
async def get_metrics():
    return {
        "metrics": {
            "request_count": 42,
            "llm_calls": 15,
            "retrieval_calls": 28,
            "failure_count": 2,
            "failure_rate": 0.047,
            "component_metrics": {
                "orchestrator": {
                    "calls": 42,
                    "failures": 2,
                    "failure_rate": 0.047,
                    "avg_latency_ms": 1250.5,
                    "p95_latency_ms": 2100.0,
                    "p99_latency_ms": 3200.0
                }
            }
        }
    }

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """Process a query and return mock VARA response"""
    start_time = time.time()
    request_id = request.request_id or str(uuid.uuid4())
    
    # Simulate processing time
    await asyncio.sleep(1)
    
    # Generate mock response
    response_data = generate_mock_response(request.query)
    
    elapsed_ms = (time.time() - start_time) * 1000
    
    return QueryResponse(
        status="success",
        data=response_data,
        request_id=request_id,
        elapsed_ms=elapsed_ms
    )

def generate_mock_response(query: str) -> Dict[str, Any]:
    """Generate mock VARA response for testing"""
    
    # Mock claims based on query content
    claims = []
    
    normalized_query = query.lower()
    has_ai_topic = (
        "artificial intelligence" in normalized_query
        or re.search(r"\bai\b", normalized_query) is not None
    )

    if has_ai_topic:
        claims = [
            {
                "claim_id": str(uuid.uuid4()),
                "text": "Artificial Intelligence is a branch of computer science focused on creating intelligent machines that can simulate human thinking and behavior.",
                "confidence": 0.85,
                "uncertainty": 0.15,
                "trust_level": "high",
                "verification": {
                    "verification_status": "verified",
                    "evidence_quality_score": 0.9,
                    "reasoning_validity_score": 0.8,
                    "explanation": "Strong evidence from multiple academic sources and industry reports."
                },
                "sources": [
                    {
                        "source": "web_search",
                        "snippet": "AI research has made significant progress in recent years with breakthroughs in machine learning and deep learning.",
                        "url": "https://example.com/ai-research",
                        "score": 0.9
                    },
                    {
                        "source": "dataset",
                        "snippet": "Comprehensive dataset of AI research papers and publications from leading institutions.",
                        "score": 0.85
                    },
                    {
                        "source": "retrieved_doc",
                        "snippet": "Artificial Intelligence encompasses various subfields including machine learning, natural language processing, and computer vision.",
                        "score": 0.8
                    }
                ]
            },
            {
                "claim_id": str(uuid.uuid4()),
                "text": "Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed.",
                "confidence": 0.78,
                "uncertainty": 0.22,
                "trust_level": "medium",
                "verification": {
                    "verification_status": "verified",
                    "evidence_quality_score": 0.75,
                    "reasoning_validity_score": 0.8,
                    "explanation": "Good evidence from technical documentation and academic sources."
                },
                "sources": [
                    {
                        "source": "web_search",
                        "snippet": "Machine Learning algorithms use statistical techniques to identify patterns in data and make predictions.",
                        "url": "https://example.com/ml-basics",
                        "score": 0.75
                    },
                    {
                        "source": "retrieved_doc",
                        "snippet": "Supervised, unsupervised, and reinforcement learning are the main categories of machine learning.",
                        "score": 0.8
                    }
                ]
            },
            {
                "claim_id": str(uuid.uuid4()),
                "text": "Deep Learning has revolutionized AI by enabling neural networks with multiple layers to learn complex patterns.",
                "confidence": 0.72,
                "uncertainty": 0.28,
                "trust_level": "medium",
                "verification": {
                    "verification_status": "verified",
                    "evidence_quality_score": 0.7,
                    "reasoning_validity_score": 0.75,
                    "explanation": "Moderate evidence with some conflicting opinions on specific applications."
                },
                "sources": [
                    {
                        "source": "web_search",
                        "snippet": "Deep learning models have achieved state-of-the-art results in image recognition, natural language processing, and game playing.",
                        "url": "https://example.com/deep-learning",
                        "score": 0.7
                    }
                ]
            }
        ]
    else:
        # Generic claims for other queries
        claims = [
            {
                "claim_id": str(uuid.uuid4()),
                "text": f"The query about '{query}' requires comprehensive research and analysis from multiple sources.",
                "confidence": 0.65,
                "uncertainty": 0.35,
                "trust_level": "medium",
                "verification": {
                    "verification_status": "verified",
                    "evidence_quality_score": 0.6,
                    "reasoning_validity_score": 0.7,
                    "explanation": "Initial analysis completed, requires deeper investigation."
                },
                "sources": [
                    {
                        "source": "web_search",
                        "snippet": "Preliminary search results indicate this topic requires further research.",
                        "score": 0.6
                    }
                ]
            }
        ]
    
    # Generate mock graph
    nodes = []
    edges = []
    
    for i, claim in enumerate(claims):
        nodes.append({
            "id": claim["claim_id"],
            "text": claim["text"][:100] + "..." if len(claim["text"]) > 100 else claim["text"],
            "trust_level": claim["trust_level"],
            "confidence": claim["confidence"]
        })
        
        # Add some relationships
        if i > 0:
            edges.append({
                "source": claims[0]["claim_id"],
                "target": claim["claim_id"],
                "type": "supports"
            })
    
    # Add a contradiction for testing
    if len(claims) > 2:
        edges.append({
            "source": claims[1]["claim_id"],
            "target": claims[2]["claim_id"],
            "type": "contradicts"
        })
    
    return {
        "goal": f"Research and analyze: {query}",
        "subtasks": [
            {"description": "Define key concepts and terminology"},
            {"description": "Gather relevant information from multiple sources"},
            {"description": "Analyze and synthesize findings"},
            {"description": "Generate verified claims with confidence scores"}
        ],
        "claims": claims,
        "graph": {
            "nodes": nodes,
            "edges": edges
        },
        "overall_confidence": sum(c["confidence"] for c in claims) / len(claims),
        "risk_level": "medium" if sum(c["confidence"] for c in claims) / len(claims) < 0.75 else "low"
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting VARA Test API Server...")
    print("📊 Frontend should be available at: http://localhost:3000")
    print("🔗 API will be available at: http://localhost:8000")
    print("🧪 Test query: 'What is Artificial Intelligence?'")
    uvicorn.run(app, host="0.0.0.0", port=8000)
