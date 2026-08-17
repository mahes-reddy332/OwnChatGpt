import re
import httpx
from langchain_core.tools import tool

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None


@tool
def web_search(query: str, max_results: int = 5) -> str:
    """
    Search the web for real-time information, latest 2026 news, technical documentation, and answers.
    
    Args:
        query (str): The search keywords or question.
        max_results (int): Maximum number of search results to return (default 5).
    """
    # 1. Try real-time DDGS search
    if DDGS is not None:
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
                if results:
                    formatted = []
                    for i, r in enumerate(results, 1):
                        title = r.get("title", f"Result {i}").strip()
                        body = r.get("body", "").strip()
                        href = r.get("href", "")
                        formatted.append(f"[{i}] {title}\nURL: {href}\nSnippet: {body}")
                    return f"Web Search Results for '{query}':\n\n" + "\n\n".join(formatted)
        except Exception:
            pass

    # 2. Fallback to direct HTTP search
    try:
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            resp = client.post(url, data={"q": query}, headers=headers)
            
        if resp.status_code != 200:
            return f"Web search returned HTTP status {resp.status_code} for query: {query}"

        snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', resp.text, re.DOTALL)
        titles = re.findall(r'<a class="result__url[^>]*>(.*?)</a>', resp.text, re.DOTALL)
        
        results = []
        for i in range(min(max_results, len(snippets))):
            clean_snip = re.sub(r'<[^>]+>', '', snippets[i]).strip()
            clean_title = re.sub(r'<[^>]+>', '', titles[i]).strip() if i < len(titles) else f"Result {i+1}"
            if clean_snip:
                results.append(f"[{i+1}] {clean_title}\n{clean_snip}")

        if not results:
            return f"No search results found for: '{query}'."

        return f"Web Search Results for '{query}':\n\n" + "\n\n".join(results)

    except Exception as e:
        return f"Search Error: {e}"


@tool
def fetch_web_page(url: str) -> str:
    """
    Fetch and read the text content of any web page URL (articles, technical docs, Wikipedia, GitHub, blogs).
    Extracts clean readable article text, removing ads, scripts, navigation, and styling.
    
    Args:
        url (str): The HTTP or HTTPS URL to fetch.
    """
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    # Robust header profile compatible with bot-protected sites (Wikipedia, Cloudflare, Docs)
    headers_list = [
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        {
            "User-Agent": "AgenticAIChatbot/1.0 (https://github.com/agentic; contact@agentic.ai) Python-httpx/0.28.1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
    ]

    html_content = ""
    status_code = None

    for headers in headers_list:
        try:
            with httpx.Client(timeout=12.0, follow_redirects=True) as client:
                resp = client.get(url, headers=headers)
                status_code = resp.status_code
                if resp.status_code == 200:
                    html_content = resp.text
                    break
        except Exception:
            continue

    if not html_content:
        return f"Failed to fetch content from '{url}' (HTTP Status: {status_code or 'Timeout/Network Error'})."

    # Parse and clean HTML using BeautifulSoup
    if BeautifulSoup is not None:
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Extract page title
            title = soup.title.string.strip() if soup.title and soup.title.string else url
            
            # Remove clutter elements
            for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form", "noscript", "svg"]):
                tag.extract()

            # Extract clean paragraphs and headers
            text = soup.get_text(separator="\n")
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            clean_text = "\n".join(lines)
            
            # Truncate to reasonable context length
            if len(clean_text) > 4000:
                clean_text = clean_text[:4000] + "\n\n...[Content truncated for length]..."

            return f"Webpage Content from [{title}]({url}):\n\n{clean_text}"
        except Exception as e:
            pass

    # Regex fallback if BS4 fails
    cleaned = re.sub(r'<script.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'<style.*?</style>', '', cleaned, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', cleaned)
    text = re.sub(r'\s+', ' ', text).strip()

    truncated = text[:4000]
    if len(text) > 4000:
        truncated += "\n\n...[Content truncated for length]..."

    return f"Webpage Content from {url}:\n\n{truncated}"
