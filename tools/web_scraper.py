import requests
from bs4 import BeautifulSoup


class WebScraper:
    def fetch(self, url):
        try:
            res = requests.get(url, timeout=5)
            soup = BeautifulSoup(res.text, "html.parser")

            paragraphs = [p.get_text() for p in soup.find_all("p")]

            return " ".join(paragraphs)
        except:
            return ""