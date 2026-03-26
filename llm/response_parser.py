import json
import re


class ResponseParser:
    MAX_RETRIES = 2

    @staticmethod
    def parse_json(text: str):
        try:
            return json.loads(text)
        except:
            cleaned = ResponseParser._extract_json(text)
            return json.loads(cleaned)

    @staticmethod
    def _extract_json(text: str):
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("No JSON found")
        return match.group(0)

    @staticmethod
    def safe_parse(llm, prompt):
        for _ in range(ResponseParser.MAX_RETRIES):
            response = llm.generate(prompt)
            try:
                return ResponseParser.parse_json(response)
            except:
                prompt += "\nFix JSON format."
        raise ValueError("Failed to parse LLM response")