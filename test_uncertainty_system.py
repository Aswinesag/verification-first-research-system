#!/usr/bin/env python3

"""
Test script for Phase 6: Uncertainty Estimation and Confidence Calibration
"""

from llm.groq_client import GroqLLM
from llm.hf_client import HFLLM
from llm.llm_router import LLMRouter
from config.settings import settings
from core.orchestrator import Orchestrator
from graph.graph_metrics import GraphMetrics
from utils.logging_utils import setup_logger, log_error, log_info

# Setup logging
logger = setup_logger("test_uncertainty")

def test_uncertainty_system():
    try:
        log_info(logger, "Initializing VARA system with uncertainty estimation...")
        
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
        log_info(logger, "Orchestrator with uncertainty estimation initialized successfully")
        
        # Test queries designed to validate uncertainty estimation
        test_queries = [
            {
                "query": "AI improves healthcare outcomes",
                "expected_behavior": "moderate confidence, some uncertainty",
                "reason": "Should have mixed evidence and moderate trust"
            },
            {
                "query": "AI always makes correct medical decisions", 
                "expected_behavior": "low confidence, high uncertainty",
                "reason": "Overconfident claim should be penalized"
            },
            {
                "query": "AI has no risks in healthcare",
                "expected_behavior": "low confidence if contradicted",
                "reason": "Should trigger contradiction penalties"
            },
            {
                "query": "AI slightly improves diagnostic accuracy",
                "expected_behavior": "higher confidence, lower uncertainty", 
                "reason": "Moderate claim with good evidence should be trusted"
            }
        ]
        
        for i, test_case in enumerate(test_queries, 1):
            log_info(logger, f"\\n=== UNCERTAINTY TEST {i}: {test_case['query']} ===")
            
            # Run system
            result = orch.run(test_case['query'])
            
            print(f"\\nTEST {i}: {test_case['query']}")
            print(f"Expected: {test_case['expected_behavior']}")
            print(f"Claims generated: {len(result['claims'])}")
            
            # Analyze uncertainty results
            if 'system_confidence' in result:
                sys_conf = result['system_confidence']
                print(f"\\nSYSTEM CONFIDENCE: {sys_conf['overall_confidence']:.3f}")
                print(f"RISK LEVEL: {sys_conf['risk_level']}")
                print(f"EXPLANATION: {sys_conf['explanation']}")
                
                # Validate against expectations
                confidence = sys_conf['overall_confidence']
                risk = sys_conf['risk_level']
                
                if "high confidence" in test_case['expected_behavior'] and confidence > 0.7:
                    print("✅ PASS: High confidence as expected")
                elif "low confidence" in test_case['expected_behavior'] and confidence < 0.5:
                    print("✅ PASS: Low confidence as expected")
                elif "high uncertainty" in test_case['expected_behavior'] and sys_conf.get('average_uncertainty', 0) > 0.5:
                    print("✅ PASS: High uncertainty as expected")
                elif "moderate confidence" in test_case['expected_behavior'] and 0.4 <= confidence <= 0.7:
                    print("✅ PASS: Moderate confidence as expected")
                else:
                    print("⚠️  PARTIAL: Behavior may not match expectations")
            
            # Analyze individual claim uncertainties
            claim_uncertainties = []
            for claim in result.get('claims', []):
                if hasattr(claim, 'uncertainty'):
                    uncertainty_data = claim.uncertainty
                    claim_uncertainties.append({
                        'claim_id': claim.claim_id[:8],
                        'confidence': uncertainty_data.get('final_confidence', 0),
                        'uncertainty': uncertainty_data.get('uncertainty', 1),
                        'trust_level': uncertainty_data.get('trust_level', 'unknown'),
                        'explanation': uncertainty_data.get('explanation', '')
                    })
            
            if claim_uncertainties:
                print(f"\\nCLAIM UNCERTAINTIES:")
                for cu in claim_uncertainties[:3]:  # Show first 3 claims
                    print(f"  Claim {cu['claim_id']}: confidence={cu['confidence']:.2f}, "
                          f"uncertainty={cu['uncertainty']:.2f}, trust={cu['trust_level']}")
                    if cu['explanation']:
                        print(f"    Reason: {cu['explanation'][:80]}...")
            
            # Graph metrics
            try:
                metrics = GraphMetrics().compute(orch.state.graph.graph)
                print(f"\\nGRAPH METRICS: {metrics}")
                
                # Check for contradiction edges
                edges = orch.state.graph.graph.edges(data=True)
                contradiction_edges = [e for e in edges if e[2].get('edge_type') == 'contradicts']
                if contradiction_edges:
                    print(f"CONTRADICTION EDGES: {len(contradiction_edges)}")
                    for edge in contradiction_edges[:2]:  # Show first 2
                        print(f"  {edge[0][:8]}... contradicts {edge[1][:8]}... "
                              f"(severity: {edge[2].get('severity', 'unknown')}, "
                              f"confidence: {edge[2].get('confidence', 0):.2f})")
                else:
                    print("NO CONTRADICTION EDGES DETECTED")
                    
            except Exception as e:
                log_error(logger, e, "Failed to compute graph metrics")
            
            print("\\n" + "="*80)
            
            # Reset state for next test
            orch.state = orch.state.__class__()
            orch.state.graph = orch.state.graph.__class__()
            
        log_info(logger, "Uncertainty estimation testing completed")
        
    except Exception as e:
        log_error(logger, e, "Uncertainty system test failed")
        print(f"\\nSYSTEM ERROR: {e}")
        print("Please check logs above for details.")

if __name__ == "__main__":
    test_uncertainty_system()
