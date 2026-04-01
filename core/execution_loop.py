from enum import Enum
from config.settings import settings
from utils.logging_utils import setup_logger, log_error, log_info
from graph.conflict_detector import ConflictDetector
from uncertainty.uncertainty_estimator import UncertaintyEstimator


class StepType(str, Enum):
    EXECUTE = "execute"
    VERIFY = "verify"
    CONFLICT_DETECT = "conflict_detect"


class ExecutionLoop:
    def __init__(self, state, executor, verifier, debate_agent=None, llm=None, uncertainty_estimator=None):
        self.state = state
        self.executor = executor
        self.verifier = verifier
        self.debate_agent = debate_agent
        self.llm = llm
        self.uncertainty_estimator = uncertainty_estimator
        self.logger = setup_logger("execution_loop")
        # Use the graph from state instead of creating a new one
        self.graph = state.graph
        # Initialize conflict detector
        self.conflict_detector = ConflictDetector(llm=llm)

    def run(self):
        try:
            steps = 0
            log_info(self.logger, "Starting execution loop")

            while steps < settings.MAX_EXECUTION_STEPS:
                task = self.state.get_next_task()
                if not task:
                    log_info(self.logger, "No more tasks to process")
                    break

                log_info(self.logger, f"Processing task: {task.description[:50]}...")

                # -------------------------
                # EXECUTION (Debate-enabled)
                # -------------------------
                try:
                    if self.debate_agent:
                        claims = self.debate_agent.run(task)
                        log_info(self.logger, f"Debate agent generated {len(claims)} claims")
                    else:
                        claims = self.executor(task)
                        log_info(self.logger, f"Executor generated {len(claims)} claims")
                except Exception as e:
                    log_error(self.logger, e, f"Failed to execute task: {task.description[:30]}...")
                    self.state.mark_task_failed(task.task_id)
                    steps += 1
                    continue

                all_verified = True
                verified_claims = []
                claims_with_uncertainty = []

                for claim in claims:
                    try:
                        self.state.add_claim(claim)

                        verification = self.verifier(claim)
                        self.state.add_verification(verification)
                        
                        # Estimate uncertainty if available
                        uncertainty_result = None
                        if self.uncertainty_estimator:
                            graph_context = {
                                'contradictions': []  # Will be updated after conflict detection
                            }
                            uncertainty_result = self.uncertainty_estimator.estimate_claim_uncertainty(
                                claim.__dict__ if hasattr(claim, '__dict__') else claim,
                                verification.__dict__ if hasattr(verification, '__dict__') else verification,
                                graph_context
                            )
                            claims_with_uncertainty.append(uncertainty_result)
                        
                        self.graph.add_claim(claim, verification)

                        if verification.verification_status != "verified":
                            all_verified = False
                        
                        # Store verified claims for conflict detection
                        verified_claims.append((claim, verification))

                        self.state.log_step({
                            "step": StepType.VERIFY,
                            "claim_id": claim.claim_id,
                            "status": verification.verification_status
                        })
                        
                    except Exception as e:
                        log_error(self.logger, e, f"Failed to process claim: {claim.claim_text[:30]}...")
                        all_verified = False

                # -------------------------
                # CONFLICT DETECTION
                # -------------------------
                if len(verified_claims) >= 2 and self.uncertainty_estimator:
                    try:
                        conflicts = self.conflict_detector.detect(self.graph)
                        
                        if conflicts:
                            log_info(self.logger, f"Detected {len(conflicts)} conflicts")
                            
                            # Update uncertainty estimates with conflict information
                            for claim, verification in verified_claims:
                                claim_id = claim.claim_id
                                graph_context = {
                                    'contradictions': conflicts
                                }
                                
                                # Re-estimate uncertainty with conflict information
                                uncertainty_result = self.uncertainty_estimator.estimate_claim_uncertainty(
                                    claim.__dict__ if hasattr(claim, '__dict__') else claim,
                                    verification.__dict__ if hasattr(verification, '__dict__') else verification,
                                    graph_context
                                )
                                
                                # Update claim with uncertainty information
                                if hasattr(claim, 'uncertainty'):
                                    claim.uncertainty = uncertainty_result
                                
                            # Downgrade verification confidence for conflicting claims
                            for conflict in conflicts:
                                self._handle_conflict(conflict, verified_claims)
                            
                            # Log conflict detection step
                            self.state.log_step({
                                "step": StepType.CONFLICT_DETECT,
                                "conflicts_found": len(conflicts),
                                "conflict_summary": self.conflict_detector.get_conflict_summary(conflicts)
                            })
                        else:
                            log_info(self.logger, "No conflicts detected")
                            
                    except Exception as e:
                        log_error(self.logger, e, "Conflict detection failed")
                
                # Estimate system-level confidence if uncertainty estimator available
                if self.uncertainty_estimator and task_claims_with_uncertainty:
                    try:
                        system_confidence = self.uncertainty_estimator.estimate_system_confidence(task_claims_with_uncertainty)
                        log_info(self.logger, f"System confidence: {system_confidence['overall_confidence']:.3f}, risk: {system_confidence['risk_level']}")
                        
                        # Store system confidence in state
                        self.state.system_confidence = system_confidence
                        
                    except Exception as e:
                        log_error(self.logger, e, "Failed to estimate system confidence")
            
                if all_verified:
                    self.state.mark_task_complete(task.task_id)
                    log_info(self.logger, f"Task completed: {task.task_id}")
                else:
                    self.state.mark_task_failed(task.task_id)
                    log_info(self.logger, f"Task failed: {task.task_id}")

                steps += 1

            log_info(self.logger, f"Execution loop completed after {steps} steps")
            
        except Exception as e:
            log_error(self.logger, e, "Execution loop failed")
            raise
    
    def _handle_conflict(self, conflict, verified_claims):
        """Handle detected conflicts by downgrading verification confidence"""
        try:
            node1_id = conflict["node1_id"]
            node2_id = conflict["node2_id"]
            confidence = conflict["confidence"]
            severity = conflict["severity"]
            
            # Find corresponding claims
            for claim, verification in verified_claims:
                if claim.claim_id in [node1_id, node2_id]:
                    # Apply confidence penalty based on conflict severity
                    penalty_factor = 0.5 if severity == "strong" else 0.7 if severity == "moderate" else 0.85
                    
                    # Update verification scores
                    new_evidence_score = verification.evidence_quality_score * penalty_factor
                    new_reasoning_score = verification.reasoning_validity_score * penalty_factor
                    
                    # Add conflict flag
                    new_flags = verification.contradiction_flags.copy()
                    if "conflict_detected" not in new_flags:
                        new_flags.append("conflict_detected")
                    
                    # Update verification result
                    updated_verification = verification.__class__(
                        claim_id=verification.claim_id,
                        verification_status=verification.verification_status,
                        evidence_quality_score=new_evidence_score,
                        reasoning_validity_score=new_reasoning_score,
                        contradiction_flags=new_flags,
                        verifier_notes=f"{verification.verifier_notes or ''} | Conflict: {conflict['reason'][:100]}"
                    )
                    
                    # Update state
                    self.state.verifications[verification.claim_id] = updated_verification
                    
                    log_info(self.logger, f"Downgraded verification for claim {claim.claim_id[:8]}... due to {severity} conflict")
                    
        except Exception as e:
            log_error(self.logger, e, "Failed to handle conflict")