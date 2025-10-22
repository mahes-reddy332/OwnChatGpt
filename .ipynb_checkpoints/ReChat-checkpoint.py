import streamlit as st
from openai import OpenAI

# -----------------------------
# ✅ CONFIG
# -----------------------------
st.set_page_config(page_title="AI Code Debugger", page_icon="🧠", layout="centered")

client = OpenAI(api_key="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")

SYSTEM_PROMPT = """
You are an expert Python and C++ debugger.
Identify the error, explain it, and show the corrected code clearly.
Respond in this format:

Error:
<short description>

Explanation:
<why it happens>

Fixed Code:
<corrected code>
"""

# -----------------------------
# ✅ Streamlit App Layout
# -----------------------------
st.title("🧠 AI Code Debugger")
st.caption("Debug Python or C++ code with GPT-4o-mini — by Lokesh 🚀")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hi 👋! Paste your code here and I’ll debug it for you."}
    ]

# Display previous messages
for msg in st.session_state.messages:
    if msg["role"] == "user":
        with st.chat_message("user"):
            st.code(msg["content"], language="python")
    else:
        with st.chat_message("assistant"):
            st.markdown(msg["content"])

# Chat input
user_input = st.chat_input("Paste your code snippet here...")

if user_input:
    # Save user message
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.code(user_input, language="python")

    # Generate response
    with st.chat_message("assistant"):
        with st.spinner("Analyzing code... 🧩"):
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        *[
                            {"role": m["role"], "content": m["content"]}
                            for m in st.session_state.messages
                        ],
                    ],
                    temperature=0.3
                )
                reply = response.choices[0].message.content
            except Exception as e:
                reply = f"⚠️ Error: {e}"

            st.markdown(reply)

    # Save response
    st.session_state.messages.append({"role": "assistant", "content": reply})
