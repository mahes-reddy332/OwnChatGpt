import streamlit as st
from openai import OpenAI

# -----------------------------
# ✅ CONFIG
# -----------------------------
st.set_page_config(page_title="AI Code Debugger", page_icon="🧠", layout="centered")

client = OpenAI(api_key="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")

SYSTEM_PROMPT = """
You are an expert AI coding assistant who helps debug and explain code in a clear and friendly way.
When a user pastes some Python or C++ code, you should:
- Detect and explain any syntax or logical errors.
- Suggest how to fix them with short, clean explanations.
- Provide the corrected version of the code.
- If there are no errors, explain why the code is correct and how it works.

Be conversational, concise, and well-formatted using Markdown and code blocks.
Your tone should sound like ChatGPT — friendly, confident, and educational.
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
    with st.chat_message(msg["role"], avatar="🧑‍💻" if msg["role"]=="user" else "🤖"):
        if msg["role"] == "user":
            st.code(msg["content"], language="python")
        else:
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
