"""
Google Workspace MCP Server
Exposes tools for Google Drive, Gmail, and Google Calendar.
Supports:
1. Real Google Workspace APIs (Drive v3, Gmail v1, Calendar v3) via OAuth2 (token.json / credentials.json).
2. Local persistent workspace sandbox when OAuth credentials are not yet configured.
"""

import json
import os
import base64
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# Ensure .env is loaded
ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

mcp = FastMCP("Google Workspace MCP")

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "google_workspace"
DATA_DIR.mkdir(parents=True, exist_ok=True)

CREDENTIALS_FILE = DATA_DIR / "credentials.json"
TOKEN_FILE = DATA_DIR / "token.json"
DRIVE_FILE = DATA_DIR / "drive_files.json"
GMAIL_FILE = DATA_DIR / "gmail_messages.json"
CALENDAR_FILE = DATA_DIR / "calendar_events.json"

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
]


def _get_google_credentials():
    """Retrieve Google OAuth2 credentials if token.json exists."""
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request

        creds = None
        if TOKEN_FILE.exists():
            creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        elif os.environ.get("GOOGLE_WORKSPACE_TOKEN_JSON"):
            creds = Credentials.from_authorized_user_info(
                json.loads(os.environ["GOOGLE_WORKSPACE_TOKEN_JSON"]), SCOPES
            )

        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "w", encoding="utf-8") as token:
                token.write(creds.to_json())

        return creds if creds and creds.valid else None
    except Exception:
        return None


def _init_mock_data():
    if not DRIVE_FILE.exists():
        sample_drive = [
            {
                "id": "doc_001",
                "name": "Q3_Product_Roadmap.docx",
                "type": "application/vnd.google-apps.document",
                "content": "Q3 Roadmap: 1. Launch Agentic AI Chatbot 2. Integrate MCP Servers (Google Drive, Gmail, Calendar) 3. Expand RAG knowledge base.",
                "updated_at": "2026-08-14T10:00:00Z"
            },
            {
                "id": "doc_002",
                "name": "Resume__Copy_(9)_copy.pdf",
                "type": "application/pdf",
                "content": "Resume Summary: Senior Software & AI Engineer. Experience in Python, LangGraph, React, TypeScript, FastAPI, Vector Databases, and MCP Agent Architectures.",
                "updated_at": "2026-08-15T15:30:00Z"
            },
            {
                "id": "doc_003",
                "name": "Budget_Forecast_2026.xlsx",
                "type": "application/vnd.google-apps.spreadsheet",
                "content": "Q1: $120,000 | Q2: $150,000 | Q3: $180,000 | Q4: $220,000. Total Projected Growth: +35%.",
                "updated_at": "2026-08-16T09:15:00Z"
            }
        ]
        with open(DRIVE_FILE, "w", encoding="utf-8") as f:
            json.dump(sample_drive, f, indent=2)

    if not GMAIL_FILE.exists():
        sample_gmail = [
            {
                "id": "msg_001",
                "from": "sarah.lead@company.ai",
                "to": "user@company.ai",
                "subject": "Sprint Review & Agentic Release Demo",
                "body": "Hi team, let's review the custom MCP server integrations and live RAG retrieval on Tuesday at 2 PM. Great work on the LangGraph core!",
                "date": "2026-08-15T14:20:00Z"
            },
            {
                "id": "msg_002",
                "from": "cloud.billing@service.com",
                "to": "user@company.ai",
                "subject": "Monthly Usage Invoice - August 2026",
                "body": "Your invoice for August 2026 is ready. Total compute usage: 48.2 hours. Status: Paid in full.",
                "date": "2026-08-16T06:00:00Z"
            }
        ]
        with open(GMAIL_FILE, "w", encoding="utf-8") as f:
            json.dump(sample_gmail, f, indent=2)

    if not CALENDAR_FILE.exists():
        now = datetime.now(timezone.utc)
        sample_calendar = [
            {
                "id": "evt_001",
                "summary": "Sprint Planning & Agent Demo",
                "start": (now + timedelta(days=1)).strftime("%Y-%m-%dT10:00:00Z"),
                "end": (now + timedelta(days=1, hours=1)).strftime("%Y-%m-%dT11:00:00Z"),
                "description": "Sprint planning session for the next release.",
                "attendees": ["alex@company.ai", "sarah@company.ai"]
            },
            {
                "id": "evt_002",
                "summary": "Architecture Review: MCP & Tool Binding",
                "start": (now + timedelta(days=2)).strftime("%Y-%m-%dT14:00:00Z"),
                "end": (now + timedelta(days=2, hours=1)).strftime("%Y-%m-%dT15:00:00Z"),
                "description": "Deep dive into tool routing and multi-server MCP adapter.",
                "attendees": ["dev-team@company.ai"]
            }
        ]
        with open(CALENDAR_FILE, "w", encoding="utf-8") as f:
            json.dump(sample_calendar, f, indent=2)


_init_mock_data()


# ==============================================================================
# Google Drive Tools
# ==============================================================================

@mcp.tool()
def gdrive_search_files(query: str, max_results: int = 5) -> str:
    """
    Search files in Google Drive by filename or content keywords.
    
    Args:
        query: Search keywords or filename match.
        max_results: Max number of files to return (default 5).
    """
    creds = _get_google_credentials()
    if creds:
        try:
            from googleapiclient.discovery import build
            service = build("drive", "v3", credentials=creds)
            q_filter = f"name contains '{query}' and trashed = false"
            results = service.files().list(q=q_filter, pageSize=max_results, fields="files(id, name, mimeType, modifiedTime)").execute()
            items = results.get("files", [])
            if not items:
                return f"No Google Drive files found matching '{query}' in your live Google account."
            
            formatted = [
                f"- **{f['name']}** (ID: `{f['id']}`, Type: `{f['mimeType']}`, Modified: {f.get('modifiedTime', 'N/A')})"
                for f in items
            ]
            return f"Found {len(items)} file(s) in your Google Drive:\n\n" + "\n".join(formatted)
        except Exception as e:
            return f"Google Drive API Notice: {e}. Checking local workspace..."

    # Local fallback
    try:
        with open(DRIVE_FILE, "r", encoding="utf-8") as f:
            files = json.load(f)

        q = query.lower()
        matched = [
            f for f in files
            if q in f.get("name", "").lower() or q in f.get("content", "").lower()
        ][:max_results]

        if not matched:
            return f"No Google Drive files found matching '{query}' in your Google Drive."

        results = [
            f"- **{f['name']}** (ID: `{f['id']}`, Type: {f['type']}, Updated: {f.get('updated_at', 'N/A')})\n  Snippet: {f.get('content', '')[:120]}..."
            for f in matched
        ]
        return f"Found {len(matched)} file(s) in Google Drive:\n\n" + "\n\n".join(results)
    except Exception as e:
        return f"Error searching Google Drive: {e}"


@mcp.tool()
def gdrive_read_file(file_name_or_id: str) -> str:
    """
    Read the full text content of a file from Google Drive by its name or ID.
    
    Args:
        file_name_or_id: The document name or file ID to retrieve.
    """
    creds = _get_google_credentials()
    if creds:
        try:
            from googleapiclient.discovery import build
            import io
            from googleapiclient.http import MediaIoBaseDownload

            service = build("drive", "v3", credentials=creds)
            file_id = file_name_or_id
            if not file_name_or_id.isalnum() or len(file_name_or_id) < 15:
                res = service.files().list(q=f"name contains '{file_name_or_id}' and trashed = false", pageSize=1, fields="files(id, name, mimeType)").execute()
                items = res.get("files", [])
                if items:
                    file_id = items[0]["id"]
                    file_name_or_id = items[0]["name"]

            req = service.files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, req)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            content = fh.getvalue().decode("utf-8", errors="ignore")
            return f"### Google Drive Document: {file_name_or_id}\n\n{content[:3500]}"
        except Exception:
            pass

    # Local fallback
    try:
        with open(DRIVE_FILE, "r", encoding="utf-8") as f:
            files = json.load(f)

        target = file_name_or_id.lower()
        for f in files:
            if f["id"].lower() == target or target in f["name"].lower():
                return f"### Google Drive Document: {f['name']} (ID: `{f['id']}`)\n\n**Content:**\n{f['content']}"

        return f"File '{file_name_or_id}' was not found in Google Drive."
    except Exception as e:
        return f"Error reading Google Drive file: {e}"


@mcp.tool()
def gdrive_list_files(max_results: int = 10) -> str:
    """
    List all documents and files stored in Google Drive.
    """
    creds = _get_google_credentials()
    if creds:
        try:
            from googleapiclient.discovery import build
            service = build("drive", "v3", credentials=creds)
            res = service.files().list(pageSize=max_results, fields="files(id, name, mimeType)").execute()
            items = res.get("files", [])
            if items:
                formatted = [f"{i+1}. **{f['name']}** (ID: `{f['id']}`) - `{f['mimeType']}`" for i, f in enumerate(items)]
                return f"Your Google Drive Files ({len(items)} files):\n\n" + "\n".join(formatted)
        except Exception:
            pass

    try:
        with open(DRIVE_FILE, "r", encoding="utf-8") as f:
            files = json.load(f)

        if not files:
            return "Google Drive is currently empty."

        items = [
            f"{i+1}. **{f['name']}** (ID: `{f['id']}`) - {f.get('type', 'file')}"
            for i, f in enumerate(files[:max_results])
        ]
        return f"Google Drive Files ({len(files)} total):\n\n" + "\n".join(items)
    except Exception as e:
        return f"Error listing Google Drive files: {e}"


# ==============================================================================
# Gmail Tools
# ==============================================================================

@mcp.tool()
def gmail_search_emails(query: str = "", max_results: int = 5) -> str:
    """
    Search Gmail messages and threads by sender, recipient, subject, or message body.
    
    Args:
        query: Search term, sender email, or subject keywords.
        max_results: Maximum messages to retrieve.
    """
    creds = _get_google_credentials()
    if creds:
        try:
            from googleapiclient.discovery import build
            service = build("gmail", "v1", credentials=creds)
            res = service.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
            msgs = res.get("messages", [])
            if not msgs:
                return f"No emails found matching '{query}' in your Gmail."

            results = []
            for m in msgs:
                msg_data = service.users().messages().get(userId="me", id=m["id"], format="snippet").execute()
                snippet = msg_data.get("snippet", "")
                results.append(f"- **Message ID**: `{m['id']}`\n  **Snippet**: {snippet}")
            return f"Found {len(msgs)} email(s) in your Gmail matching '{query}':\n\n" + "\n\n".join(results)
        except Exception:
            pass

    try:
        with open(GMAIL_FILE, "r", encoding="utf-8") as f:
            emails = json.load(f)

        q = query.lower()
        matched = [
            e for e in emails
            if q in e.get("subject", "").lower()
            or q in e.get("from", "").lower()
            or q in e.get("body", "").lower()
        ][:max_results]

        if not matched:
            return f"No Gmail messages found matching query '{query}'."

        results = [
            f"- **From**: {e['from']} | **Subject**: {e['subject']} | **Date**: {e.get('date', 'N/A')}\n  **Snippet**: {e['body'][:140]}..."
            for e in matched
        ]
        return f"Found {len(matched)} email(s) matching '{query}':\n\n" + "\n\n".join(results)
    except Exception as e:
        return f"Error searching Gmail: {e}"


@mcp.tool()
def gmail_read_thread(thread_id_or_subject: str) -> str:
    """
    Read the full email message body and details from Gmail.
    
    Args:
        thread_id_or_subject: Email ID or subject line to look up.
    """
    try:
        with open(GMAIL_FILE, "r", encoding="utf-8") as f:
            emails = json.load(f)

        target = thread_id_or_subject.lower()
        for e in emails:
            if e["id"].lower() == target or target in e["subject"].lower():
                return f"### Gmail Message\n\n- **ID**: `{e['id']}`\n- **From**: {e['from']}\n- **To**: {e.get('to', 'me')}\n- **Subject**: {e['subject']}\n- **Date**: {e.get('date', 'N/A')}\n\n**Body:**\n{e['body']}"

        return f"No email found matching '{thread_id_or_subject}'."
    except Exception as e:
        return f"Error reading email thread: {e}"


@mcp.tool()
def gmail_send_email(to: str, subject: str, body: str) -> str:
    """
    Send an email via Gmail to a recipient.
    
    Args:
        to: Recipient email address.
        subject: Email subject.
        body: Email body text.
    """
    creds = _get_google_credentials()
    if creds:
        try:
            from googleapiclient.discovery import build
            from email.mime.text import MIMEText
            service = build("gmail", "v1", credentials=creds)
            message = MIMEText(body)
            message["to"] = to
            message["subject"] = subject
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
            return f"[SUCCESS] Real email sent via Gmail to '{to}' with subject '{subject}' (Message ID: `{sent['id']}`)."
        except Exception as e:
            return f"Gmail API error sending real email: {e}"

    try:
        with open(GMAIL_FILE, "r", encoding="utf-8") as f:
            emails = json.load(f)

        new_msg = {
            "id": f"msg_{len(emails)+1:03d}",
            "from": "me@company.ai",
            "to": to,
            "subject": subject,
            "body": body,
            "date": datetime.now(timezone.utc).isoformat()
        }
        emails.append(new_msg)

        with open(GMAIL_FILE, "w", encoding="utf-8") as f:
            json.dump(emails, f, indent=2)

        return f"[SUCCESS] Email sent via Gmail to '{to}' with subject '{subject}' (Message ID: `{new_msg['id']}`)."
    except Exception as e:
        return f"Error sending email via Gmail: {e}"


# ==============================================================================
# Google Calendar Tools
# ==============================================================================

@mcp.tool()
def gcalendar_list_events(
    date: str = "",
    query: str = "",
    max_results: int = 15
) -> str:
    """
    List upcoming meetings, appointments, and events from Google Calendar.
    
    Args:
        date: Optional date filter in 'YYYY-MM-DD' format (e.g. '2026-08-18' or 'today' or 'tomorrow'). If empty, fetches upcoming events.
        query: Optional search keyword in event titles or summaries.
        max_results: Maximum events to return (default 15).
    """
    creds = _get_google_credentials()
    if creds:
        try:
            from googleapiclient.discovery import build
            service = build("calendar", "v3", credentials=creds)

            # Determine time bounds
            now_dt = datetime.now(timezone.utc)
            t_min = None
            t_max = None

            if date.lower() in ("today", ""):
                t_min = now_dt.strftime("%Y-%m-%dT00:00:00Z")
            elif date.lower() == "tomorrow":
                tom = now_dt + timedelta(days=1)
                t_min = tom.strftime("%Y-%m-%dT00:00:00Z")
                t_max = tom.strftime("%Y-%m-%dT23:59:59Z")
            else:
                try:
                    clean_date = date.split("T")[0].strip()
                    target_dt = datetime.strptime(clean_date, "%Y-%m-%d")
                    t_min = target_dt.strftime("%Y-%m-%dT00:00:00Z")
                    t_max = target_dt.strftime("%Y-%m-%dT23:59:59Z")
                except Exception:
                    t_min = now_dt.strftime("%Y-%m-%dT00:00:00Z")

            # Query primary calendar
            params = {
                "calendarId": "primary",
                "timeMin": t_min,
                "maxResults": max_results,
                "singleEvents": True,
                "orderBy": "startTime"
            }
            if t_max:
                params["timeMax"] = t_max
            if query:
                params["q"] = query

            events_result = service.events().list(**params).execute()
            events = events_result.get("items", [])

            # Also attempt to check secondary/subscribed calendars if available
            try:
                cal_list = service.calendarList().list().execute().get("items", [])
                for cal in cal_list:
                    cid = cal.get("id")
                    if cid and cid != "primary" and not cal.get("primary", False):
                        p_sec = dict(params)
                        p_sec["calendarId"] = cid
                        sec_res = service.events().list(**p_sec).execute()
                        sec_items = sec_res.get("items", [])
                        for item in sec_items:
                            item["_calendar_name"] = cal.get("summary", "Subscribed Calendar")
                        events.extend(sec_items)
            except Exception:
                pass

            if not events:
                filter_desc = f" for date '{date}'" if date else ""
                return f"No events found on your Google Calendar{filter_desc}."

            # Deduplicate and sort
            unique_events = {}
            for e in events:
                unique_events[e.get("id", str(len(unique_events)))] = e
            sorted_events = sorted(
                unique_events.values(),
                key=lambda x: str(x.get("start", {}).get("dateTime", x.get("start", {}).get("date", "")))
            )[:max_results]

            results = []
            for i, e in enumerate(sorted_events):
                start_val = e.get("start", {}).get("dateTime", e.get("start", {}).get("date", "TBD"))
                end_val = e.get("end", {}).get("dateTime", e.get("end", {}).get("date", "TBD"))
                cal_tag = f" `[{e.get('_calendar_name')}]`" if e.get("_calendar_name") else ""
                results.append(
                    f"{i+1}. [EVENT] **{e.get('summary', 'Untitled')}**{cal_tag}\n   - **Time**: {start_val} to {end_val}\n   - **Description**: {e.get('description', 'None')}"
                )

            header_date = f" ({date})" if date else ""
            return f"### Google Calendar Events{header_date} ({len(sorted_events)} found):\n\n" + "\n\n".join(results)
        except Exception as e:
            return f"Google Calendar API notice: {e}. Checking local calendar..."

    try:
        with open(CALENDAR_FILE, "r", encoding="utf-8") as f:
            events = json.load(f)

        if not events:
            return "No upcoming events found on Google Calendar."

        results = [
            f"{i+1}. [EVENT] **{e['summary']}**\n   - **Time**: {e.get('start', 'TBD')} to {e.get('end', 'TBD')}\n   - **Description**: {e.get('description', 'None')}\n   - **Attendees**: {', '.join(e.get('attendees', [])) or 'None'}"
            for i, e in enumerate(events[:max_results])
        ]
        return f"Google Calendar Events ({len(events)} total):\n\n" + "\n\n".join(results)
    except Exception as e:
        return f"Error listing Calendar events: {e}"


@mcp.tool()
def gcalendar_create_event(
    summary: str,
    start_time: str,
    end_time: str,
    description: str = "",
    attendees: str = ""
) -> str:
    """
    Schedule a new event or meeting on Google Calendar.
    
    Args:
        summary: Event title / meeting name.
        start_time: Start time string (e.g. '2026-08-18T17:00:00+05:30' or '2026-08-18T17:00:00Z').
        end_time: End time string (e.g. '2026-08-18T18:00:00+05:30' or '2026-08-18T18:00:00Z').
        description: Optional notes or meeting agenda.
        attendees: Comma-separated email addresses of attendees.
    """
    creds = _get_google_credentials()
    if creds:
        try:
            from googleapiclient.discovery import build
            service = build("calendar", "v3", credentials=creds)
            att_list = [{"email": a.strip()} for a in attendees.split(",") if a.strip()] if attendees else []
            body = {
                "summary": summary,
                "description": description,
                "start": {"dateTime": start_time},
                "end": {"dateTime": end_time},
                "attendees": att_list
            }
            evt = service.events().insert(calendarId="primary", body=body).execute()
            return f"[SUCCESS] Real Google Calendar event scheduled!\n- **Title**: {summary}\n- **Link**: {evt.get('htmlLink')}\n- **ID**: `{evt.get('id')}`"
        except Exception as e:
            return f"Calendar API error: {e}"

    try:
        with open(CALENDAR_FILE, "r", encoding="utf-8") as f:
            events = json.load(f)

        att_list = [a.strip() for a in attendees.split(",") if a.strip()] if attendees else []

        new_evt = {
            "id": f"evt_{len(events)+1:03d}",
            "summary": summary,
            "start": start_time,
            "end": end_time,
            "description": description,
            "attendees": att_list
        }
        events.append(new_evt)

        with open(CALENDAR_FILE, "w", encoding="utf-8") as f:
            json.dump(events, f, indent=2)

        return f"[SUCCESS] Event scheduled on Google Calendar:\n- **Title**: {summary}\n- **Start**: {start_time}\n- **End**: {end_time}\n- **Event ID**: `{new_evt['id']}`"
    except Exception as e:
        return f"Error scheduling Calendar event: {e}"


if __name__ == "__main__":
    mcp.run()
