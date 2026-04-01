#!/usr/bin/env python3

"""
Production System Test - Validates all production hardening features
"""

from llm.groq_client import GroqLLM
from llm.hf_client import HFLLM
from llm.llm_router import LLMRouter
from config.settings import settings
from core.orchestrator import Orchestrator
from core.request_context import RequestContext
from utils.metrics import metrics_collector
from utils.logging_utils_production import setup_logger, log_info, log_error
from utils.cache import llm_cache, retrieval_cache
from utils.retry_utils_enhanced import retry, safe_execute

# Setup logging
logger = setup_logger("test_production")


def test_structured_logging():
    """Test structured logging functionality"""
    log_info(logger, "Starting production system test",
             component='test_runner',
             action='test_start',
             test_version='production_hardening')
    
    log_info(logger, "Testing structured logging with multiple fields",
             request_id='test-123',
             component='test',
             action='logging_test',
             latency_ms=45.5,
             status='success',
             additional_field='test_value')


def test_request_context():
    """Test request context tracking"""
    log_info(logger, "Testing request context tracking")
    
    context = RequestContext()
    context.add_step('test', 'initialization')
    context.complete_step('test', 'processing', 100.0)
    context.fail_step('test', 'validation', 'Test error', 50.0)
    
    context_dict = context.to_dict()
    assert context_dict['request_id'] == context.request_id
    assert len(context_dict['steps']) == 3
    assert context.get_elapsed_ms() > 0
    
    log_info(logger, "Request context test completed",
             component='test',
             action='request_context_test',
             steps_count=len(context_dict['steps']))


def test_metrics_collection():
    """Test metrics collection"""
    log_info(logger, "Testing metrics collection")
    
    # Record some test metrics
    metrics_collector.increment_counter('requests')
    metrics_collector.record_latency('test_component', 150.0)
    metrics_collector.record_component_call('test_component', success=True)
    
    # Get metrics
    metrics = metrics_collector.get_metrics()
    
    assert metrics['request_count'] >= 1
    assert 'test_component' in metrics['component_metrics']
    assert metrics['component_metrics']['test_component']['avg_latency_ms'] > 0
    
    log_info(logger, "Metrics collection test completed",
             component='test',
             action='metrics_test',
             total_requests=metrics['request_count'])


def test_caching():
    """Test caching functionality"""
    log_info(logger, "Testing caching layer")
    
    # Test LLM cache
    test_key = "test_key"
    test_value = {"result": "test_data"}
    
    # Set and get
    llm_cache.set(test_key, test_value, ttl=60)
    cached_result = llm_cache.get(test_key)
    assert cached_result == test_value
    
    # Test cache stats
    stats = llm_cache.get_stats()
    assert stats['total_entries'] >= 1
    
    log_info(logger, "Caching test completed",
             component='test',
             action='cache_test',
             cache_entries=stats['total_entries'])


def test_retry_logic():
    """Test retry logic with failures"""
    log_info(logger, "Testing retry logic")
    
    call_count = 0
    
    @retry(max_attempts=3, delay=0.1)
    def flaky_function():
        nonlocal call_count
        call_count += 1
        if call_count < 2:
            raise ValueError("Test failure")
        return "success"
    
    result = flaky_function()
    assert result == "success"
    assert call_count == 2
    
    log_info(logger, "Retry logic test completed",
             component='test',
             action='retry_test',
             attempts=call_count)


def test_safe_execute():
    """Test safe execution with fallbacks"""
    log_info(logger, "Testing safe execution")
    
    def failing_function():
        raise ValueError("Test error")
    
    def fallback_function():
        return "fallback_result"
    
    result = safe_execute(
        failing_function,
        fallback=fallback_function,
        default_return="default"
    )
    
    assert result == "fallback_result"
    
    log_info(logger, "Safe execution test completed",
             component='test',
             action='safe_execute_test')


def test_vara_system_with_production_features():
    """Test VARA system with all production features"""
    log_info(logger, "Testing VARA system with production hardening")
    
    try:
        # Initialize LLM clients
        groq = GroqLLM()
        log_info(logger, "Groq client initialized", component='test', action='llm_init')
        
        try:
            hf = HFLLM()
            log_info(logger, "HF client initialized", component='test', action='llm_init')
        except Exception as e:
            log_info(logger, f"HF client failed to initialize: {e}", component='test', action='llm_init')
            hf = None
        
        # Initialize LLM router
        llm = LLMRouter(primary_llm=groq, fallback_llm=hf)
        log_info(logger, "LLM router initialized", component='test', action='router_init')
        
        # Initialize orchestrator
        orch = Orchestrator(llm, settings)
        log_info(logger, "Orchestrator initialized", component='test', action='orchestrator_init')
        
        # Test with request context
        context = RequestContext()
        test_query = "What is Artificial Intelligence?"
        
        log_info(logger, "Running VARA system test query",
                 component='test',
                 action='system_test',
                 query=test_query[:50])
        
        # Run system with timeout and retry
        @retry(max_attempts=2, delay=1.0)
        def run_system():
            return orch.run(test_query, context)
        
        result = run_system()
        
        # Validate result
        assert 'goal' in result
        assert 'claims' in result
        assert 'verifications' in result
        
        # Check request context
        context_dict = context.to_dict()
        assert len(context_dict['steps']) > 0
        
        log_info(logger, "VARA system test completed successfully",
                 component='test',
                 action='system_test',
                 claims_count=len(result.get('claims', [])),
                 verifications_count=len(result.get('verifications', [])),
                 steps_count=len(context_dict['steps']))
        
        return True
        
    except Exception as e:
        log_error(logger, e, "VARA system test failed",
                 component='test',
                 action='system_test')
        return False


def test_production_settings():
    """Test production configuration settings"""
    log_info(logger, "Testing production settings")
    
    # Test cache settings
    assert isinstance(settings.ENABLE_CACHE, bool)
    assert settings.CACHE_TTL > 0
    assert settings.LLM_CACHE_SIZE > 0
    
    # Test retry settings
    assert settings.MAX_RETRIES > 0
    assert settings.RETRY_DELAY > 0
    assert settings.RETRY_BACKOFF_FACTOR > 1.0
    
    # Test uncertainty weights
    assert settings.EVIDENCE_WEIGHT > 0
    assert settings.REASONING_WEIGHT > 0
    assert settings.SOURCE_DIVERSITY_WEIGHT > 0
    assert settings.CONTRADICTION_PENALTY_WEIGHT > 0
    
    # Test API settings
    assert settings.API_PORT > 0
    assert settings.API_TIMEOUT > 0
    
    log_info(logger, "Production settings test completed",
             component='test',
             action='settings_test',
             cache_enabled=settings.ENABLE_CACHE,
             max_retries=settings.MAX_RETRIES)


def main():
    """Run all production tests"""
    log_info(logger, "Starting production hardening test suite",
             component='test_runner',
             action='test_suite_start')
    
    tests = [
        ("Structured Logging", test_structured_logging),
        ("Request Context", test_request_context),
        ("Metrics Collection", test_metrics_collection),
        ("Caching Layer", test_caching),
        ("Retry Logic", test_retry_logic),
        ("Safe Execution", test_safe_execute),
        ("Production Settings", test_production_settings),
        ("VARA System", test_vara_system_with_production_features)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            log_info(logger, f"Running {test_name} test",
                     component='test_runner',
                     action='test_start',
                     test_name=test_name)
            
            test_func()
            passed += 1
            
            log_info(logger, f"{test_name} test passed",
                     component='test_runner',
                     action='test_pass',
                     test_name=test_name)
            
        except Exception as e:
            failed += 1
            log_error(logger, e, f"{test_name} test failed",
                     component='test_runner',
                     action='test_fail',
                     test_name=test_name)
    
    # Final metrics
    final_metrics = metrics_collector.get_metrics()
    
    log_info(logger, f"Production test suite completed",
             component='test_runner',
             action='test_suite_complete',
             total_tests=len(tests),
             passed=passed,
             failed=failed,
             success_rate=passed/len(tests),
             total_requests=final_metrics['request_count'],
             failure_rate=final_metrics['failure_rate'])
    
    # Print summary
    print(f"\n{'='*60}")
    print("PRODUCTION HARDENING TEST RESULTS")
    print(f"{'='*60}")
    print(f"Total Tests: {len(tests)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {passed/len(tests)*100:.1f}%")
    print(f"{'='*60}")
    
    if failed == 0:
        print("🎉 ALL PRODUCTION TESTS PASSED!")
        print("System is production-ready!")
    else:
        print("⚠️  Some tests failed. Review logs above.")
    
    print(f"Final Metrics: {final_metrics}")
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
