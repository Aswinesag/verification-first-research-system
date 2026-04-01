import requests
import os


class WebSearchTool:
    def __init__(self):
        self.api_key = os.getenv("SERPER_API_KEY")

    def search(self, query, k=5):
        url = "https://google.serper.dev/search"

        payload = {"q": query}
        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }

        res = requests.post(url, json=payload, headers=headers)
        data = res.json()

        results = []
        for item in data.get("organic", [])[:k]:
            results.append({
                "title": item.get("title"),
                "link": item.get("link"),
                "snippet": item.get("snippet")
            })

        return results