from utils.logging_utils import setup_logger, log_error, log_info
from utils.retry_utils import retry


class DebateAgent:
    def __init__(self, executor, verifier, rounds=2):
        self.executor = executor
        self.verifier = verifier
        self.rounds = rounds
        self.logger = setup_logger("debate_agent")

    @retry(max_attempts=2, delay=1.0)
    def run(self, task):
        try:
            log_info(self.logger, f"Starting debate for task: {task.description[:50]}...")
            best_claims = []

            for round_num in range(self.rounds):
                try:
                    log_info(self.logger, f"Debate round {round_num + 1}/{self.rounds}")
                    claims = self.executor(task)
                    
                    if not claims:
                        log_info(self.logger, f"No claims generated in round {round_num + 1}")
                        continue

                    scored = []
                    for claim in claims:
                        try:
                            v = self.verifier(claim)
                            score = (v.evidence_quality_score + v.reasoning_validity_score) / 2
                            scored.append((claim, score))
                        except Exception as e:
                            log_error(self.logger, e, f"Failed to verify claim in round {round_num + 1}")
                            # Still include claim with low score
                            scored.append((claim, 0.0))

                    scored.sort(key=lambda x: x[1], reverse=True)

                    if scored:
                        best_claim, best_score = scored[0]
                        best_claims.append(best_claim)
                        log_info(self.logger, f"Round {round_num + 1} best claim score: {best_score:.2f}")

                except Exception as e:
                    log_error(self.logger, e, f"Debate round {round_num + 1} failed")
                    continue

            log_info(self.logger, f"Debate completed with {len(best_claims)} best claims")
            return best_claims
            
        except Exception as e:
            log_error(self.logger, e, "Debate agent failed")
            # Fallback: try single execution
            try:
                log_info(self.logger, "Attempting fallback execution")
                return self.executor(task)
            except Exception as fallback_error:
                log_error(self.logger, fallback_error, "Fallback execution failed")
                return []