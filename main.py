from llm.groq_client import GroqLLM
from llm.hf_client import HFLLM
from llm.llm_router import LLMRouter
from config.settings import settings
from core.orchestrator import Orchestrator
from graph.graph_metrics import GraphMetrics

groq = GroqLLM()
hf = HFLLM()

llm = LLMRouter(primary_llm=groq, fallback_llm=hf)

orch = Orchestrator(llm, settings)

query = "What is Artificial Intelligence and how is it used in healthcare?"

result = orch.run(query)

print("\nFINAL OUTPUT:\n")
print(result)

metrics = GraphMetrics().compute(orch.state.graph.graph)

print("\nGRAPH METRICS:", metrics)