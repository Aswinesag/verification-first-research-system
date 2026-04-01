from llm.groq_client import GroqLLM
from llm.hf_client import HFLLM
from llm.llm_router import LLMRouter
from config.settings import settings
from core.orchestrator import Orchestrator
from graph.graph_metrics import GraphMetrics
from utils.logging_utils_production import setup_logger, log_error, log_info

# Setup logging
logger = setup_logger("main")

try:
    log_info(logger, "Initializing LLM clients...")
    
    # Initialize Groq client (primary)
    groq = GroqLLM()
    log_info(logger, "Groq client initialized successfully")
    
    # Initialize HF client with fallback handling
    try:
        hf = HFLLM()
        log_info(logger, "HF client initialized successfully")
    except Exception as e:
        log_error(logger, e, "HF client initialization failed, using Groq only")
        hf = None

    # Setup LLM router with fallback
    if hf:
        llm = LLMRouter(primary_llm=groq, fallback_llm=hf)
    else:
        llm = LLMRouter(primary_llm=groq, fallback_llm=None)
    
    log_info(logger, "LLM router initialized")
    
    # Initialize orchestrator
    orch = Orchestrator(llm, settings)
    log_info(logger, "Orchestrator initialized")

    # Test query
    query = "What is Artificial Intelligence and how is it used in healthcare?"
    log_info(logger, f"Starting execution with query: {query}")

    result = orch.run(query)

    print("\nFINAL OUTPUT:\n")
    print(result)

    # Compute graph metrics
    try:
        metrics = GraphMetrics().compute(orch.state.graph.graph)
        print("\nGRAPH METRICS:", metrics)
    except Exception as e:
        log_error(logger, e, "Failed to compute graph metrics")
        print("\nGRAPH METRICS: Unable to compute due to error")
    
    log_info(logger, "Execution completed successfully")
    
except Exception as e:
    log_error(logger, e, "System execution failed")
    print(f"\nSYSTEM ERROR: {e}")
    print("Please check the logs above for details.")