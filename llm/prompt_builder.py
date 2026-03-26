def enforce_json_format():
    return """
STRICT RULES:
- Output ONLY valid JSON
- No markdown
- No explanations
- No trailing text
"""


def build_planner_prompt(query: str) -> str:
    return f"""
{enforce_json_format()}

Return:
{{
  "objective": "string",
  "subtasks": ["string"]
}}

Query: {query}
"""


def build_executor_prompt(task_desc: str) -> str:
    return f"""
{enforce_json_format()}

Return:
{{
  "claims": [
    {{"text": "string", "confidence": 0.0}}
  ]
}}

Task: {task_desc}
"""


def build_verifier_prompt(claim: str) -> str:
    return f"""
{enforce_json_format()}

Return:
{{
  "evidence_score": 0.0,
  "reasoning_score": 0.0,
  "verdict": "verified | weak | unsupported"
}}

Claim: {claim}
"""