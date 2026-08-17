import httpx
from langchain_core.tools import tool


@tool
def tech_docs_search(topic: str) -> str:
    """
    Search educational, algorithmic, and scientific documentation for in-depth concepts, definitions, and technical explanations.
    
    Args:
        topic (str): The technical topic or concept to research (e.g. 'Transformer neural network', 'Dijkstra algorithm', 'LangChain').
    """
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + topic.replace(" ", "_")
    headers = {"User-Agent": "AgenticChatbot/1.0"}

    try:
        with httpx.Client(timeout=8.0, follow_redirects=True) as client:
            resp = client.get(url, headers=headers)

        if resp.status_code == 200:
            data = resp.json()
            title = data.get("title", topic)
            extract = data.get("extract", "No extract available.")
            page_url = data.get("content_urls", {}).get("desktop", {}).get("page", "")

            return (
                f"Technical Summary for '{title}':\n\n"
                f"{extract}\n\n"
                f"Source: {page_url}"
            )
        else:
            return f"No direct technical encyclopedia entry found for '{topic}'."

    except Exception as e:
        return f"Research Error: {e}"
