import os
from pathlib import Path
from langchain_core.tools import tool

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent


def _resolve_safe_path(rel_path: str) -> Path:
    """Resolve a relative path ensuring it stays within the workspace."""
    clean = rel_path.strip().lstrip("/\\")
    full_path = (WORKSPACE_ROOT / clean).resolve()
    # Ensure no path traversal escaping workspace
    if not str(full_path).startswith(str(WORKSPACE_ROOT)):
        raise PermissionError(f"Access denied: path '{rel_path}' is outside workspace root.")
    return full_path


@tool
def filesystem_inspector(
    action: str,
    path: str = ".",
    start_line: int = 1,
    end_line: int = 100,
) -> str:
    """
    Inspect files and directories in the workspace codebase.
    
    Args:
        action (str): One of 'read_file', 'list_dir', or 'file_exists'.
        path (str): Relative file or directory path (e.g. 'backend/app/main.py', 'frontend/src').
        start_line (int): 1-indexed line to start reading from (for 'read_file').
        end_line (int): 1-indexed line to stop reading at (for 'read_file').
    """
    try:
        target = _resolve_safe_path(path)
    except Exception as e:
        return f"Filesystem Error: {e}"

    if action == "file_exists":
        exists = target.exists()
        is_file = target.is_file()
        return f"Path exists: {exists}, Is file: {is_file}, Is dir: {target.is_dir() if exists else False}"

    elif action == "list_dir":
        if not target.exists() or not target.is_dir():
            return f"Filesystem Error: Directory '{path}' not found or is not a directory."
        try:
            items = []
            for entry in sorted(os.listdir(target)):
                if entry in {".git", ".venv", "node_modules", "__pycache__", ".pytest_cache"}:
                    continue
                sub_path = target / entry
                prefix = "[DIR] " if sub_path.is_dir() else "[FILE]"
                size = f" ({sub_path.stat().st_size} bytes)" if sub_path.is_file() else ""
                items.append(f"{prefix} {entry}{size}")
            return f"Directory listing of '{path}':\n" + "\n".join(items)
        except Exception as e:
            return f"Error listing directory: {e}"

    elif action == "read_file":
        if not target.exists() or not target.is_file():
            return f"Filesystem Error: File '{path}' not found."
        try:
            with open(target, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
            
            total_lines = len(lines)
            selected = lines[max(0, start_line - 1):min(total_lines, end_line)]
            numbered = [
                f"{i + start_line}: {line.rstrip()}"
                for i, line in enumerate(selected)
            ]
            return f"File '{path}' (Lines {start_line}-{min(total_lines, end_line)} of {total_lines}):\n" + "\n".join(numbered)
        except Exception as e:
            return f"Error reading file: {e}"

    return f"Unsupported action '{action}'. Supported: 'read_file', 'list_dir', 'file_exists'."
