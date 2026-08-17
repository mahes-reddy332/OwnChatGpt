import uuid
import logging
from typing import Any
from langchain_core.tools import tool
from langgraph.types import interrupt
from app.tools.registry import get_tool_registry

logger = logging.getLogger("app.hitl.tools")


@tool
def send_email_action(recipient: str, subject: str, body: str) -> dict:
    """
    Send an email to a recipient with a subject line and body text.
    
    CRITICAL: This tool requires explicit Human-in-the-Loop (HITL) approval
    before sending the email.
    """
    interrupt_id = str(uuid.uuid4())
    payload = {
        "interrupt_id": interrupt_id,
        "tool_name": "send_email_action",
        "action": f"Send Email to {recipient}",
        "description": f"Subject: '{subject}'\n\nBody Preview:\n{body[:150]}...",
        "args": {
            "recipient": recipient,
            "subject": subject,
            "body": body,
        },
    }

    # Pause the graph and request human approval
    decision = interrupt(payload)

    # Process human decision
    is_approved = False
    final_args = {"recipient": recipient, "subject": subject, "body": body}

    if isinstance(decision, str):
        is_approved = decision.lower() in ("yes", "approve", "approved", "true")
    elif isinstance(decision, dict):
        decision_str = str(decision.get("decision", "")).lower()
        is_approved = decision_str in ("yes", "approve", "approved", "true")
        if "modified_args" in decision and isinstance(decision["modified_args"], dict):
            final_args.update(decision["modified_args"])

    if is_approved:
        logger.info(f"HITL Approved: Sent email to {final_args['recipient']}")
        return {
            "status": "success",
            "message": f"Email successfully dispatched to {final_args['recipient']}.",
            "details": final_args,
        }
    else:
        logger.info(f"HITL Declined: Sending email to {recipient} was cancelled by user.")
        return {
            "status": "cancelled",
            "message": f"Dispatch to {recipient} was declined and cancelled by the user.",
            "details": final_args,
        }


@tool
def execute_database_mutation(action_type: str, table_name: str, statement: str) -> dict:
    """
    Execute a modifying SQL statement (INSERT, UPDATE, DELETE, DROP) on a database table.
    
    CRITICAL: This tool requires explicit Human-in-the-Loop (HITL) approval
    before modifying database records.
    """
    interrupt_id = str(uuid.uuid4())
    payload = {
        "interrupt_id": interrupt_id,
        "tool_name": "execute_database_mutation",
        "action": f"Database Mutation ({action_type.upper()}) on '{table_name}'",
        "description": f"Executing SQL statement:\n```sql\n{statement}\n```",
        "args": {
            "action_type": action_type,
            "table_name": table_name,
            "statement": statement,
        },
    }

    # Pause the graph and request human approval
    decision = interrupt(payload)

    is_approved = False
    final_args = {"action_type": action_type, "table_name": table_name, "statement": statement}

    if isinstance(decision, str):
        is_approved = decision.lower() in ("yes", "approve", "approved", "true")
    elif isinstance(decision, dict):
        decision_str = str(decision.get("decision", "")).lower()
        is_approved = decision_str in ("yes", "approve", "approved", "true")
        if "modified_args" in decision and isinstance(decision["modified_args"], dict):
            final_args.update(decision["modified_args"])

    if is_approved:
        logger.info(f"HITL Approved: DB Mutation on {table_name}")
        return {
            "status": "success",
            "message": f"Database operation '{final_args['action_type']}' on table '{final_args['table_name']}' executed successfully.",
            "statement": final_args["statement"],
        }
    else:
        logger.info(f"HITL Declined: DB Mutation on {table_name} cancelled by user.")
        return {
            "status": "cancelled",
            "message": f"Database operation on table '{table_name}' was cancelled by the user.",
            "statement": statement,
        }


# Register sensitive tools in ToolRegistry
registry = get_tool_registry()
registry.register(send_email_action)
registry.register(execute_database_mutation)
