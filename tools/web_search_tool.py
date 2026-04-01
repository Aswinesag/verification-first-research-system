import requests
import os
from dotenv import load_dotenv
from utils.logging_utils_production import setup_logger, log_info, log_error
from utils.retry_utils import retry
import time

# Force reload environment to get latest API key
load_dotenv(override=True)


class WebSearchTool:
    def __init__(self):
        self.logger = setup_logger("web_search")
        self.api_key = os.getenv("SERPER_API_KEY")
        if not self.api_key:
            log_error(self.logger, ValueError("SERPER_API_KEY not found"), "Web search initialization")
    
    @retry(max_attempts=3, delay=2.0)
    def search(self, query, k=5):
        if not self.api_key:
            raise ValueError("SERPER_API_KEY not configured")
        
        try:
            log_info(self.logger, f"Searching web for: {query[:50]}...")
            
            url = "https://google.serper.dev/search"
            payload = {"q": query}
            headers = {
                "X-API-KEY": self.api_key,
                "Content-Type": "application/json"
            }

            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()

            results = []
            for item in data.get("organic", [])[:k]:
                results.append({
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", "")
                })

            log_info(self.logger, f"Web search returned {len(results)} results")
            return results
            
        except requests.exceptions.Timeout:
            log_error(self.logger, TimeoutError("Web search timeout"), "Web search request")
            return []
        except requests.exceptions.RequestException as e:
            log_error(self.logger, e, "Web search request failed")
            return []
        except Exception as e:
            log_error(self.logger, e, "Unexpected error in web search")
            return []