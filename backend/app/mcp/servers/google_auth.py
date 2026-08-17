"""
Google Workspace OAuth Authentication Helper
Reads backend/data/google_workspace/credentials.json and performs OAuth consent flow
to generate backend/data/google_workspace/token.json.
"""

from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "google_workspace"
CREDENTIALS_FILE = DATA_DIR / "credentials.json"
TOKEN_FILE = DATA_DIR / "token.json"

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.events",
]


def authenticate_google_workspace():
    if not CREDENTIALS_FILE.exists():
        print(f"[ERROR] Credentials file not found at: {CREDENTIALS_FILE}")
        return False

    print("==================================================")
    print(" Google Workspace OAuth Authentication")
    print("==================================================")
    print("Opening Google OAuth consent screen in your browser...")

    try:
        flow = InstalledAppFlow.from_client_secrets_file(
            str(CREDENTIALS_FILE),
            SCOPES
        )
        # Runs local server on port 8080 or available port to receive OAuth redirect callback
        creds = flow.run_local_server(port=8080, prompt="consent", access_type="offline")

        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(creds.to_json())

        print("\n[SUCCESS] Google Workspace authentication completed successfully!")
        print(f"Token saved to: {TOKEN_FILE}")
        print("Your real Google Drive, Gmail, and Google Calendar tools are now LIVE!")
        return True
    except Exception as e:
        print(f"\n[ERROR] Authentication failed: {e}")
        return False


if __name__ == "__main__":
    authenticate_google_workspace()
