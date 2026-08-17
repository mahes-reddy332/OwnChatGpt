import subprocess
from pathlib import Path
from langchain_core.tools import tool

# Root project directory
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent

# Dangerous command blacklist for safety
DISALLOWED_PATTERNS = [
    "rm -rf /",
    ":(){ :|:& };:",
    "format ",
    "mkfs",
    "del /s",
    "shutdown",
    "chmod -r 777 /",
]


@tool
def command_runner(command: str) -> str:
    """
    Execute a shell/terminal command within the project workspace.
    Useful for running test suites, git checks, directory listings, linting, and package queries.
    
    Args:
        command (str): The shell command line string to run (e.g. 'git status', 'python --version').
    """
    lower_cmd = command.lower()
    for pattern in DISALLOWED_PATTERNS:
        if pattern in lower_cmd:
            return f"Security Error: Command execution blocked for potentially destructive pattern: '{pattern}'."

    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=str(WORKSPACE_ROOT),
            capture_output=True,
            text=True,
            timeout=15,
        )

        output = []
        if result.stdout:
            output.append(f"STDOUT:\n{result.stdout.strip()}")
        if result.stderr:
            output.append(f"STDERR:\n{result.stderr.strip()}")

        output_str = "\n\n".join(output) if output else "Command completed with no output."
        return f"Exit Code: {result.returncode}\n\n{output_str}"

    except subprocess.TimeoutExpired:
        return "Execution Error: Command timed out after 15 seconds."
    except Exception as e:
        return f"Execution Error: {e}"
