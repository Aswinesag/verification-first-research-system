from llm.groq_client import GroqLLM
from llm.hf_client import HFLLM
from llm.llm_router import LLMRouter

from core.orchestrator import Orchestrator

groq = GroqLLM()
hf = HFLLM()

llm = LLMRouter(primary_llm=groq, fallback_llm=hf)

orch = Orchestrator(llm=llm)

result = orch.run("Explain quantum computing")

print(result)