import sqlite3
from pathlib import Path
from langchain_core.tools import tool

# Default local DB path
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "app.db"


@tool
def sql_inspector(query: str) -> str:
    """
    Execute a read-only SQL query (e.g. SELECT, PRAGMA) against the application database.
    Useful for inspecting database tables, schemas, and querying application data.
    
    Args:
        query (str): The SQL SELECT query to run (e.g. 'SELECT * FROM sqlite_master WHERE type="table";').
    """
    clean_query = query.strip()
    first_word = clean_query.split()[0].upper() if clean_query else ""
    
    # Read-only guard
    allowed_verbs = {"SELECT", "PRAGMA", "EXPLAIN", "SHOW", "DESCRIBE"}
    if first_word not in allowed_verbs:
        return f"Permission Error: Only read-only queries ({', '.join(allowed_verbs)}) are allowed. Received: '{first_word}'."

    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    try:
        conn = sqlite3.connect(str(DEFAULT_DB_PATH))
        cursor = conn.cursor()
        cursor.execute(clean_query)
        
        rows = cursor.fetchall()
        headers = [desc[0] for desc in cursor.description] if cursor.description else []
        conn.close()

        if not headers and not rows:
            return "Query returned 0 rows and no columns."

        # Format as Markdown table
        header_line = "| " + " | ".join(headers) + " |"
        sep_line = "| " + " | ".join(["---"] * len(headers)) + " |"
        row_lines = [
            "| " + " | ".join(str(val) for val in row) + " |"
            for row in rows[:50]
        ]

        table = "\n".join([header_line, sep_line] + row_lines)
        if len(rows) > 50:
            table += f"\n\n...[Showing 50 of {len(rows)} total rows]..."

        return f"SQL Query Result ({len(rows)} rows):\n\n{table}"

    except Exception as e:
        return f"Database Error: {e}"
