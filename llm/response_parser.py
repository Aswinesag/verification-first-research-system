import json
import re


class ResponseParser:
    MAX_RETRIES = 2

    @staticmethod
    def parse_json(text: str):
        try:
            return json.loads(text)
        except:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if not match:
                raise ValueError("No JSON found")
            return json.loads(match.group(0))

    @staticmethod
    def safe_parse(llm, prompt):
        for _ in range(ResponseParser.MAX_RETRIES):
            response = llm.generate(prompt)
            try:
                return ResponseParser.parse_json(response)
            except:
                prompt += "\nFix JSON."
        raise ValueError("Parsing failed")