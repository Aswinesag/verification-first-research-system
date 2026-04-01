class GraphMetrics:
    def compute(self, graph):
        return {
            "nodes": graph.number_of_nodes(),
            "edges": graph.number_of_edges()
        }