"""
GitHub MCP Server
Provides tools to inspect authenticated user's repositories, search issues, read code files, and list commits.
Supports authenticated GitHub REST API with GITHUB_PERSONAL_ACCESS_TOKEN.
"""

import os
from pathlib import Path
import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# Ensure .env is loaded in this subprocess
ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

mcp = FastMCP("GitHub MCP")


def _get_headers() -> dict[str, str]:
    # Check env var or fall back to reading .env directly
    token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""
    if not token and ENV_PATH.exists():
        load_dotenv(ENV_PATH, override=True)
        token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AgenticAI-MCP-Client/1.0"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


@mcp.tool()
def github_get_my_user_profile() -> str:
    """
    Get the authenticated GitHub user's profile information, login username, and repository statistics.
    """
    headers = _get_headers()
    url = "https://api.github.com/user"

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers)

        if resp.status_code == 200:
            u = resp.json()
            return f"""### 🐙 Authenticated GitHub Account
- **Username**: `{u.get('login')}`
- **Name**: {u.get('name', 'N/A')}
- **Profile URL**: {u.get('html_url')}
- **Public Repos**: {u.get('public_repos', 0)}
- **Followers**: {u.get('followers', 0)} | **Following**: {u.get('following', 0)}
- **Bio**: {u.get('bio', 'None')}"""
        else:
            return f"GitHub API response {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        return f"Error retrieving GitHub profile: {e}"


@mcp.tool()
def github_get_my_repos(limit: int = 10) -> str:
    """
    List the authenticated user's repositories sorted by most recently updated.
    
    Args:
        limit: Max number of repositories to return (default 10).
    """
    headers = _get_headers()
    url = "https://api.github.com/user/repos"
    params = {"sort": "updated", "per_page": limit}

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers, params=params)

        if resp.status_code == 200:
            repos = resp.json()
            if not repos:
                return "No repositories found for this account."

            results = [
                f"{i+1}. **[{r.get('full_name')}]({r.get('html_url')})** (Stars: {r.get('stargazers_count', 0)}, Language: `{r.get('language', 'None')}`, Updated: {r.get('updated_at', 'N/A')[:10]})\n   Description: {r.get('description', 'No description provided.')}"
                for i, r in enumerate(repos[:limit])
            ]
            return f"### Your Recent GitHub Repositories ({len(repos)}):\n\n" + "\n\n".join(results)
        elif resp.status_code == 401:
            return "GitHub API returned 401 Unauthorized. Please verify your GITHUB_PERSONAL_ACCESS_TOKEN in .env."
        else:
            return f"GitHub API error {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        return f"Error fetching your GitHub repositories: {e}"


@mcp.tool()
def github_get_latest_push(repo: str = "") -> str:
    """
    Get the newest push / latest commit from your most recently updated repository or a specified repository.
    
    Args:
        repo: Optional repository in 'owner/repo' format (e.g. 'mahes-reddy332/OwnChatGpt'). If empty, checks your most active repository.
    """
    headers = _get_headers()
    
    try:
        with httpx.Client(timeout=10.0) as client:
            target_repo = repo
            if not target_repo:
                # Find most recently updated repo
                r_repos = client.get("https://api.github.com/user/repos", headers=headers, params={"sort": "updated", "per_page": 1})
                if r_repos.status_code == 200 and r_repos.json():
                    target_repo = r_repos.json()[0].get("full_name")
                else:
                    return "Could not determine your most recent repository. Please specify the repo name (e.g. 'owner/repo')."

            url = f"https://api.github.com/repos/{target_repo}/commits"
            resp = client.get(url, headers=headers, params={"per_page": 1})
            
            if resp.status_code == 200:
                commits = resp.json()
                if not commits:
                    return f"No commits found in repository '{target_repo}'."
                
                c = commits[0]
                sha = c.get("sha", "")[:7]
                msg = c.get("commit", {}).get("message", "")
                author = c.get("commit", {}).get("author", {}).get("name", "Unknown")
                date = c.get("commit", {}).get("author", {}).get("date", "")
                commit_url = c.get("html_url", "")
                
                return f"""### 🚀 Latest Push in `{target_repo}`:
- **Commit SHA**: [`{sha}`]({commit_url})
- **Message**: {msg}
- **Author**: @{author}
- **Date**: {date}"""
            else:
                return f"GitHub API error {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        return f"Error retrieving latest push: {e}"


@mcp.tool()
def github_get_repo(repo: str) -> str:
    """
    Get statistics, star count, description, and primary language for a GitHub repository.
    
    Args:
        repo: Repository in 'owner/repo' format (e.g. 'mahes-reddy332/OwnChatGpt').
    """
    headers = _get_headers()
    url = f"https://api.github.com/repos/{repo}"
    
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers)
            
        if resp.status_code == 200:
            data = resp.json()
            return f"""### 🐙 GitHub Repository: [{data.get('full_name')}]({data.get('html_url')})
- **Description**: {data.get('description', 'None')}
- **Stars ⭐**: {data.get('stargazers_count', 0):,}
- **Forks 🍴**: {data.get('forks_count', 0):,}
- **Open Issues 🐞**: {data.get('open_issues_count', 0)}
- **Language**: {data.get('language', 'Unknown')}
- **License**: {data.get('license', {}).get('name', 'None') if data.get('license') else 'None'}
- **Default Branch**: `{data.get('default_branch', 'main')}`"""
        elif resp.status_code == 404:
            return f"Repository '{repo}' not found on GitHub."
        else:
            return f"GitHub API Error {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        return f"Error connecting to GitHub: {e}"


@mcp.tool()
def github_search_issues(repo: str, query: str = "", state: str = "open") -> str:
    """
    Search issues and pull requests in a GitHub repository.
    
    Args:
        repo: Repository in 'owner/repo' format.
        query: Optional search keyword.
        state: 'open', 'closed', or 'all' (default 'open').
    """
    headers = _get_headers()
    url = f"https://api.github.com/repos/{repo}/issues"
    params = {"state": state, "per_page": 5}
    
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers, params=params)

        if resp.status_code == 200:
            issues = resp.json()
            if not issues:
                return f"No {state} issues found in '{repo}'."

            if query:
                issues = [i for i in issues if query.lower() in i.get("title", "").lower() or query.lower() in i.get("body", "").lower()]

            results = [
                f"- [#{i.get('number')}: {i.get('title')}]({i.get('html_url')}) (by @{i.get('user', {}).get('login', 'unknown')})\n  State: `{i.get('state')}` | Comments: {i.get('comments', 0)}"
                for i in issues[:5]
            ]
            return f"### GitHub Issues in `{repo}`:\n\n" + "\n\n".join(results)
        else:
            return f"GitHub API error {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        return f"Error fetching GitHub issues: {e}"


@mcp.tool()
def github_list_commits(repo: str, limit: int = 5) -> str:
    """
    List recent commits from a GitHub repository.
    
    Args:
        repo: Repository in 'owner/repo' format.
        limit: Number of commits to return (default 5).
    """
    headers = _get_headers()
    url = f"https://api.github.com/repos/{repo}/commits"
    params = {"per_page": limit}

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers, params=params)

        if resp.status_code == 200:
            commits = resp.json()
            results = []
            for c in commits[:limit]:
                sha = c.get("sha", "")[:7]
                msg = c.get("commit", {}).get("message", "").split("\n")[0]
                author = c.get("commit", {}).get("author", {}).get("name", "Unknown")
                date = c.get("commit", {}).get("author", {}).get("date", "")
                url_commit = c.get("html_url", "")
                results.append(f"- [`{sha}`]({url_commit}) {msg} *(by {author} on {date[:10]})*")
            return f"### Recent Commits for `{repo}`:\n\n" + "\n".join(results)
        else:
            return f"GitHub API error {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        return f"Error fetching GitHub commits: {e}"


@mcp.tool()
def github_get_file_content(repo: str, path: str, branch: str = "main") -> str:
    """
    Read the contents of a file from a GitHub repository.
    
    Args:
        repo: Repository in 'owner/repo' format.
        path: File path inside the repo (e.g. 'README.md' or 'package.json').
        branch: Git branch name (default 'main').
    """
    url = f"https://raw.githubusercontent.com/{repo}/{branch}/{path}"
    headers = _get_headers()
    
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers)

        if resp.status_code == 200:
            content = resp.text
            if len(content) > 3000:
                content = content[:3000] + "\n\n...[Truncated for length]..."
            return f"### File: `{path}` from `{repo}` ({branch})\n\n```\n{content}\n```"
        elif resp.status_code == 404:
            return f"File '{path}' not found on branch '{branch}' in '{repo}'."
        else:
            return f"HTTP error {resp.status_code} fetching file from GitHub."
    except Exception as e:
        return f"Error reading GitHub file: {e}"


if __name__ == "__main__":
    mcp.run()
