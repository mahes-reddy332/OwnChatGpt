import io
import sys
import traceback
from contextlib import redirect_stdout, redirect_stderr
from langchain_core.tools import tool


@tool
def code_evaluator(code: str) -> str:
    """
    Execute a Python code snippet in an isolated sandbox environment.
    Captures printed stdout, evaluated return values, and errors/tracebacks.
    Useful for testing algorithms, data analysis, calculations, or writing scripts.
    
    Args:
        code (str): The valid Python code string to execute.
    """
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    
    # Execution scope
    local_scope: dict = {}
    global_scope = {
        "__builtins__": __builtins__,
    }

    try:
        with redirect_stdout(stdout_buf), redirect_stderr(stderr_buf):
            # Try to compile code in exec mode
            compiled = compile(code, "<agent_code_sandbox>", "exec")
            exec(compiled, global_scope, local_scope)

        stdout_val = stdout_buf.getvalue().strip()
        stderr_val = stderr_buf.getvalue().strip()

        output_parts = []
        if stdout_val:
            output_parts.append(f"Output:\n{stdout_val}")
        if stderr_val:
            output_parts.append(f"Stderr:\n{stderr_val}")

        # Check for meaningful variables created
        interesting_vars = {
            k: v for k, v in local_scope.items()
            if not k.startswith("_") and not callable(v)
        }
        if interesting_vars and not stdout_val:
            vars_repr = "\n".join(f"{k} = {repr(v)}" for k, v in interesting_vars.items())
            output_parts.append(f"Result Variables:\n{vars_repr}")

        if not output_parts:
            return "Code executed successfully with no output."

        return "\n\n".join(output_parts)

    except Exception:
        tb = traceback.format_exc(limit=4)
        return f"Execution Error:\n{tb}"
