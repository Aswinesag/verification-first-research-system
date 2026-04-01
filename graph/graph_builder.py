import networkx as nx


class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_claim(self, claim, verification):
        self.graph.add_node(
            claim.claim_id,
            text=claim.claim_text,
            confidence=claim.confidence,
            status=verification.verification_status
        )

    def add_relation(self, source_id, target_id, relation):
        self.graph.add_edge(source_id, target_id, type=relation)

    def get_graph(self):
        return self.graph