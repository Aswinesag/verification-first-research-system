#!/usr/bin/env python3

"""
Simple test for uncertainty estimation system
"""

from uncertainty.uncertainty_estimator import UncertaintyEstimator
from utils.logging_utils import setup_logger, log_info

def test_uncertainty_simple():
    """Test uncertainty estimation with sample data"""
    logger = setup_logger("test_uncertainty_simple")
    
    # Initialize uncertainty estimator
    estimator = UncertaintyEstimator()
    
    # Test case 1: High confidence claim
    claim1 = {
        'claim_id': 'test1',
        'claim_text': 'AI improves healthcare outcomes with strong evidence',
        'confidence': 0.8,
        'evidence_sources': [
            {'source': 'web_search', 'snippet': 'Studies show AI improves diagnosis accuracy'},
            {'source': 'dataset', 'snippet': 'Clinical trials demonstrate improved patient outcomes'},
            {'source': 'retrieved_doc', 'snippet': 'Research confirms AI benefits in healthcare'}
        ]
    }
    
    verification1 = {
        'evidence_quality_score': 0.8,
        'reasoning_validity_score': 0.7,
        'contradiction_flags': []
    }
    
    graph_context1 = {'contradictions': []}
    
    result1 = estimator.estimate_claim_uncertainty(claim1, verification1, graph_context1)
    
    print("TEST 1: High confidence claim")
    print(f"  Final Confidence: {result1['final_confidence']:.3f}")
    print(f"  Uncertainty: {result1['uncertainty']:.3f}")
    print(f"  Trust Level: {result1['trust_level']}")
    print(f"  Explanation: {result1['explanation']}")
    print()
    
    # Test case 2: Low confidence claim with contradictions
    claim2 = {
        'claim_id': 'test2',
        'claim_text': 'AI has no risks in healthcare',
        'confidence': 0.9,
        'evidence_sources': [
            {'source': 'retrieved_doc', 'snippet': 'Generic disclaimer text'}
        ]
    }
    
    verification2 = {
        'evidence_quality_score': 0.2,
        'reasoning_validity_score': 0.3,
        'contradiction_flags': ['weak_evidence', 'overconfident_claim']
    }
    
    contradictions2 = [
        {
            'node1_id': 'test2',
            'node2_id': 'test3',
            'severity': 'moderate',
            'confidence': 0.6
        }
    ]
    
    graph_context2 = {'contradictions': contradictions2}
    
    result2 = estimator.estimate_claim_uncertainty(claim2, verification2, graph_context2)
    
    print("TEST 2: Low confidence claim with contradictions")
    print(f"  Final Confidence: {result2['final_confidence']:.3f}")
    print(f"  Uncertainty: {result2['uncertainty']:.3f}")
    print(f"  Trust Level: {result2['trust_level']}")
    print(f"  Explanation: {result2['explanation']}")
    print()
    
    # Test case 3: System confidence estimation
    claims_with_uncertainty = [result1, result2]
    system_result = estimator.estimate_system_confidence(claims_with_uncertainty)
    
    print("TEST 3: System confidence estimation")
    print(f"  Overall Confidence: {system_result['overall_confidence']:.3f}")
    print(f"  Risk Level: {system_result['risk_level']}")
    print(f"  Average Uncertainty: {system_result['average_uncertainty']:.3f}")
    print(f"  Explanation: {system_result['explanation']}")
    
    log_info(logger, "Uncertainty estimation test completed successfully")

if __name__ == "__main__":
    test_uncertainty_simple()
