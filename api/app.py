"""
Production-Ready FastAPI Application for VARA System
"""

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
import time
import uuid
from contextlib import asynccontextmanager

from core.orchestrator import Orchestrator
from core.request_context import RequestContext
from llm.groq_client import GroqLLM
from llm.hf_client import HFLLM
from llm.llm_router import LLMRouter
from config.settings import settings
from utils.metrics import metrics_collector
from utils.logging_utils_production import setup_logger, log_error, log_info
from utils.retry_utils_enhanced import safe_execute, TimeoutError


logger = setup_logger("api_app")


# Pydantic Models
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="User query")
    request_id: Optional[str] = Field(None, description="Optional request ID")
    
    @validator('query')
    def validate_query(cls, v):
        if not v or not v.strip():
            raise ValueError('Query cannot be empty')
        return v.strip()


class QueryResponse(BaseModel):
    status: str = Field(..., description="Response status")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    error: Optional[Dict[str, Any]] = Field(None, description="Error details")
    request_id: str = Field(..., description="Request ID")
    elapsed_ms: float = Field(..., description="Total elapsed time in milliseconds")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Health status")
    llm: str = Field(..., description="LLM service status")
    vector_db: str = Field(..., description="Vector database status")
    web_search: str = Field(..., description="Web search status")
    uptime_seconds: float = Field(..., description="Service uptime")


class MetricsResponse(BaseModel):
    metrics: Dict[str, Any] = Field(..., description="System metrics")


# Global variables
orchestrator: Optional[Orchestrator] = None
start_time: float = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting VARA API service...")
    
    try:
        # Initialize LLM clients
        groq = GroqLLM()
        log_info(logger, "Groq client initialized successfully")
        
        try:
            hf = HFLLM()
            log_info(logger, "HF client initialized successfully")
        except Exception as e:
            log_info(logger, f"HF client failed to initialize: {e}")
            hf = None
        
        # Initialize LLM router
        llm = LLMRouter(primary_llm=groq, fallback_llm=hf)
        log_info(logger, "LLM router initialized successfully")
        
        # Initialize orchestrator
        global orchestrator
        orchestrator = Orchestrator(llm, settings)
        log_info(logger, "Orchestrator initialized successfully")
        
        logger.info("VARA API service started successfully")
        yield
        
    except Exception as e:
        log_error(logger, e, "Failed to start VARA API service")
        raise
    
    # Shutdown
    logger.info("Shutting down VARA API service...")


# Create FastAPI app
app = FastAPI(
    title="VARA AI System",
    description="Verification-First Research System with Uncertainty Estimation",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    log_error(logger, exc, f"Unhandled exception in request {request_id}")
    
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": {
                "type": type(exc).__name__,
                "message": "Internal server error",
                "request_id": request_id
            },
            "request_id": request_id
        }
    )


@app.exception_handler(TimeoutError)
async def timeout_handler(request: Request, exc: TimeoutError):
    """Timeout exception handler"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    log_error(logger, exc, f"Request {request_id} timed out")
    
    return JSONResponse(
        status_code=408,
        content={
            "status": "error",
            "error": {
                "type": "TimeoutError",
                "message": "Request timed out",
                "request_id": request_id
            },
            "request_id": request_id
        }
    )


# Middleware for request tracking
@app.middleware("http")
async def request_tracking_middleware(request: Request, call_next):
    """Track requests and add request context"""
    start_time = time.time()
    
    # Generate or use provided request ID
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Record metrics
    metrics_collector.increment_counter('requests')
    
    try:
        response = await call_next(request)
        elapsed_ms = (time.time() - start_time) * 1000
        
        # Add response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{elapsed_ms:.2f}ms"
        
        return response
    
    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        log_error(logger, e, f"Request {request_id} failed after {elapsed_ms:.2f}ms")
        raise


# API Endpoints
@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest, http_request: Request):
    """Process user query with VARA system"""
    request_id = request.request_id or http_request.state.request_id
    start_time = time.time()
    
    try:
        # Validate orchestrator is available
        if not orchestrator:
            raise HTTPException(
                status_code=503,
                detail="Service not ready - orchestrator not initialized"
            )
        
        # Create request context
        context = RequestContext(
            request_id=request_id,
            config_snapshot={
                'enable_web_search': settings.ENABLE_WEB_SEARCH,
                'enable_self_debate': settings.ENABLE_SELF_DEBATE,
                'max_execution_steps': settings.MAX_EXECUTION_STEPS
            }
        )
        
        context.add_step('api', 'query_received')
        
        # Process query with timeout
        def process_with_orchestrator():
            return orchestrator.run(request.query)
        
        result = safe_execute(
            process_with_orchestrator,
            default_return={'error': 'Processing failed'},
            exceptions=(Exception,)
        )
        
        if 'error' in result:
            raise HTTPException(
                status_code=500,
                detail="Query processing failed"
            )
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        context.complete_step('api', 'query_processed', elapsed_ms)
        
        # Record success metrics
        metrics_collector.record_component_call('api', success=True)
        metrics_collector.record_latency('api', elapsed_ms)
        
        return QueryResponse(
            status="success",
            data=result,
            request_id=request_id,
            elapsed_ms=elapsed_ms
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        log_error(logger, e, f"Query processing failed for request {request_id}")
        
        # Record failure metrics
        metrics_collector.record_component_call('api', success=False)
        metrics_collector.increment_counter('failures')
        
        return QueryResponse(
            status="error",
            error={
                "type": type(e).__name__,
                "message": str(e)
            },
            request_id=request_id,
            elapsed_ms=elapsed_ms
        )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - start_time
    
    # Check component health
    llm_status = "available" if orchestrator and orchestrator.llm else "unavailable"
    vector_db_status = "loaded" if orchestrator and orchestrator.state.graph else "unloaded"
    web_search_status = "enabled" if settings.ENABLE_WEB_SEARCH else "disabled"
    
    overall_status = "ok"
    if llm_status == "unavailable" or vector_db_status == "unloaded":
        overall_status = "degraded"
    
    return HealthResponse(
        status=overall_status,
        llm=llm_status,
        vector_db=vector_db_status,
        web_search=web_search_status,
        uptime_seconds=uptime
    )


@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """Get system metrics"""
    if not settings.ENABLE_METRICS:
        raise HTTPException(
            status_code=404,
            detail="Metrics collection is disabled"
        )
    
    return MetricsResponse(
        metrics=metrics_collector.get_metrics()
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "VARA AI System",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "query": "/query",
            "health": "/health",
            "metrics": "/metrics"
        }
    }


# Run with: uvicorn api.app:app --host 0.0.0.0 --port 8000
