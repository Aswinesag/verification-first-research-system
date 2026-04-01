class ConflictDetector:
    def detect(self, graph):
        contradictions = []

        nodes = list(graph.nodes(data=True))

        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                t1 = nodes[i][1]["text"]
                t2 = nodes[j][1]["text"]

                if self._is_conflict(t1, t2):
                    contradictions.append((nodes[i][0], nodes[j][0]))

        return contradictions

    def _is_conflict(self, t1, t2):
        return (
            "not" in t1.lower() and t2.lower() in t1.lower()
        ) or (
            "not" in t2.lower() and t1.lower() in t2.lower()
        )