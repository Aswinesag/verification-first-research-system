#!/usr/bin/env python3

"""
Test script for enhanced verification and conflict detection
"""

from llm.groq_client import GroqLLM
from llm.hf_client import HFLLM
from llm.llm_router import LLMRouter
from config.settings import settings
from core.orchestrator import Orchestrator
from graph.graph_metrics import GraphMetrics
from utils.logging_utils import setup_logger, log_error, log_info

# Setup logging
logger = setup_logger("test_enhanced")

def test_enhanced_system():
    try:
        log_info(logger, "Initializing enhanced VARA system...")
        
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
        orch = Orchestrator(llm, settings)
        log_info(logger, "Orchestrator initialized successfully")
        
        # Test queries designed to produce mixed verdicts and conflicts
        test_queries = [
            "Is AI always unbiased in healthcare?",  # Should be weak/unsupported
            "AI completely replaces doctors",         # Should be unsupported  
            "AI improves healthcare outcomes",         # Should be partially supported
            "AI has no risks in healthcare"          # Should contradict previous claims
        ]
        
        for i, query in enumerate(test_queries, 1):
            log_info(logger, f"\n=== TEST {i}: {query} ===")
            
            # Run the system
            result = orch.run(query)
            
            print(f"\nQUERY {i}: {query}")
            print(f"Claims generated: {len(result['claims'])}")
            print(f"Verifications: {len(result['verifications'])}")
            
            # Analyze verification results
            if result['verifications']:
                print("\nVERIFICATION RESULTS:")
                for v in result['verifications']:
                    # Handle both dict and VerificationResult objects
                    if isinstance(v, dict):
                        status = v.get('verification_status', 'unknown')
                        evidence_score = v.get('evidence_quality_score', 0.0)
                        reasoning_score = v.get('reasoning_validity_score', 0.0)
                        flags = v.get('contradiction_flags', [])
                        notes = v.get('verifier_notes', '')
                    else:
                        status = v.verification_status
                        evidence_score = v.evidence_quality_score
                        reasoning_score = v.reasoning_validity_score
                        flags = v.contradiction_flags
                        notes = v.verifier_notes or ""
                    
                    print(f"  - Status: {status}")
                    print(f"    Evidence Score: {evidence_score:.2f}")
                    print(f"    Reasoning Score: {reasoning_score:.2f}")
                    print(f"    Issues: {flags}")
                    if notes:
                        print(f"    Notes: {notes[:100]}...")
                    print()
            
            # Compute graph metrics
            try:
                metrics = GraphMetrics().compute(orch.state.graph.graph)
                print(f"Graph Metrics: {metrics}")
                
                # Check for contradiction edges
                edges = orch.state.graph.graph.edges(data=True)
                contradiction_edges = [e for e in edges if e[2].get('edge_type') == 'contradicts']
                if contradiction_edges:
                    print(f"CONTRADICTIONS DETECTED: {len(contradiction_edges)}")
                    for edge in contradiction_edges:
                        print(f"  - {edge[0][:8]}... contradicts {edge[1][:8]}...")
                        print(f"    Severity: {edge[2].get('severity', 'unknown')}")
                        print(f"    Confidence: {edge[2].get('confidence', 0):.2f}")
                else:
                    print("No contradictions detected")
                    
            except Exception as e:
                log_error(logger, e, "Failed to compute graph metrics")
            
            print("\n" + "="*60 + "\n")
            
            # Reset state for next test
            orch.state = orch.state.__class__()
            orch.state.graph = orch.state.graph.__class__()
        
        log_info(logger, "Enhanced system testing completed")
        
    except Exception as e:
        log_error(logger, e, "Enhanced system test failed")
        print(f"\nSYSTEM ERROR: {e}")
        print("Please check the logs above for details.")

if __name__ == "__main__":
    test_enhanced_system()
