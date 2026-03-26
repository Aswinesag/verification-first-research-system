class DebateAgent:
    def __init__(self, executor, verifier, rounds=2):
        self.executor = executor
        self.verifier = verifier
        self.rounds = rounds

    def run(self, task):
        best_claims = []

        for _ in range(self.rounds):
            claims = self.executor(task)

            scored = []
            for claim in claims:
                v = self.verifier(claim)
                score = (v.evidence_quality_score + v.reasoning_validity_score) / 2
                scored.append((claim, score))

            scored.sort(key=lambda x: x[1], reverse=True)

            if scored:
                best_claims.append(scored[0][0])

        return best_claims