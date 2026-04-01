import requests
from bs4 import BeautifulSoup
from utils.logging_utils_production import setup_logger, log_info, log_error
from utils.retry_utils import retry
import time


class WebScraper:
    def __init__(self):
        self.logger = setup_logger("web_scraper")
    
    @retry(max_attempts=2, delay=1.0)
    def fetch(self, url):
        try:
            log_info(self.logger, f"Fetching content from: {url}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            paragraphs = [p.get_text().strip() for p in soup.find_all("p")]
            paragraphs = [p for p in paragraphs if len(p) > 20]  # Filter short paragraphs
            
            content = " ".join(paragraphs)
            
            if len(content) < 100:
                log_info(self.logger, f"Content too short ({len(content)} chars)")
                return ""
            
            log_info(self.logger, f"Successfully fetched {len(content)} characters")
            return content[:5000]  # Limit content size
            
        except requests.exceptions.Timeout:
            log_error(self.logger, TimeoutError("Scraping timeout"), f"Failed to scrape {url}")
            return ""
        except requests.exceptions.RequestException as e:
            log_error(self.logger, e, f"HTTP error scraping {url}")
            return ""
        except Exception as e:
            log_error(self.logger, e, f"Unexpected error scraping {url}")
            return ""