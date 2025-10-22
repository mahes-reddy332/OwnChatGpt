import streamlit as st
from openai import OpenAI
import speech_recognition as sr
from datetime import datetime

# -----------------------------
# ✅ CONFIG
# -----------------------------
st.set_page_config(page_title="AI Code Debugger", page_icon="🧠", layout="wide")

# ⚠️ Replace with your API key
client = OpenAI(api_key="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")


SYSTEM_PROMPT = """
You are an expert AI coding assistant who helps debug and explain code in a clear and friendly way.
When a user pastes Python or C++ code, you should:
- Detect and explain syntax or logical errors.
- Suggest fixes with short, clean explanations.
- Provide the corrected version of the code.
- If there are no errors, explain why the code is correct and how it works.
Be conversational, concise, and well-formatted using Markdown and code blocks.
"""

# -----------------------------
# ✅ FIXED CSS (Sidebar Visible)
# -----------------------------
st.markdown("""
<style>
#MainMenu, footer {visibility: hidden;}
header {visibility: visible;} /* keep header visible */

/* App background */
.stApp {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #e4e4e4;
}

/* Sidebar forced visible */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%) !important;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    color: #e4e4e4 !important;
    visibility: visible !important;
    display: block !important;
    width: 300px !important;
    min-width: 280px !important;
}

/* Sidebar buttons */
[data-testid="stSidebar"] .stButton button {
    width: 100%;
    background: rgba(16, 163, 127, 0.1);
    border: 1px solid rgba(16, 163, 127, 0.3);
    color: #10a37f;
    border-radius: 8px;
    transition: all 0.3s ease;
}
[data-testid="stSidebar"] .stButton button:hover {
    background: rgba(16, 163, 127, 0.2);
    border-color: #10a37f;
}

/* Title gradient */
h1 {
    background: linear-gradient(135deg, #10a37f 0%, #1e88e5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* Chat bubbles */
.stChatMessage {
    border-radius: 12px !important;
    padding: 1rem 1.25rem !important;
    margin-bottom: 0.75rem !important;
    backdrop-filter: blur(10px);
}
[data-testid="stChatMessageContent"]:has(+ [data-testid="stChatMessageAvatar"]) {
    background: rgba(16, 163, 127, 0.15) !important;
    border-left: 3px solid #10a37f;
}
.stChatMessage[data-testid="chatMessage"] {
    background: rgba(255, 255, 255, 0.05) !important;
}

/* Code block */
.stCodeBlock {
    background-color: #0d1117 !important;
    border: 1px solid #30363d;
    border-radius: 8px;
}
</style>
""", unsafe_allow_html=True)

# -----------------------------
# ✅ SESSION STATE INIT
# -----------------------------
if "chat_history" not in st.session_state:
    st.session_state.chat_history = {}
if "current_chat" not in st.session_state:
    st.session_state.current_chat = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": "Hi 👋! Paste your code here and I'll debug it for you."}]
if "uploaded_file_data" not in st.session_state:
    st.session_state.uploaded_file_data = None

# -----------------------------
# ✅ SIDEBAR (NOW ALWAYS VISIBLE)
# -----------------------------
with st.sidebar:
    st.title("💬 Chat History")

    if st.button("➕ New Chat", use_container_width=True):
        st.session_state.current_chat = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        st.session_state.messages = [{"role": "assistant", "content": "Hi 👋! Paste your code here and I'll debug it for you."}]
        st.session_state.uploaded_file_data = None
        st.rerun()

    st.divider()

    if not st.session_state.chat_history:
        st.caption("No chats yet.")
    else:
        for chat_name in reversed(list(st.session_state.chat_history.keys())):
            if st.button(f"🗂️ {chat_name}", key=f"chat_{chat_name}", use_container_width=True):
                st.session_state.messages = st.session_state.chat_history[chat_name]
                st.session_state.current_chat = chat_name
                st.session_state.uploaded_file_data = None
                st.rerun()

# -----------------------------
# ✅ MAIN CHAT
# -----------------------------
st.title("🧠 AI Code Debugger")
st.caption("Debug Python or C++ code with GPT-4o-mini — by Lokesh 🚀")

# Uploaded file display
if st.session_state.uploaded_file_data:
    st.info(f"📎 File loaded: {st.session_state.uploaded_file_data['name']}")

# Display messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"], avatar="🧑‍💻" if msg["role"] == "user" else "🤖"):
        st.markdown(msg["content"])

# -----------------------------
# ✅ INPUT CONTROLS
# -----------------------------
col1, col2, col3 = st.columns([0.8, 0.1, 0.1])

with col1:
    uploaded_file = st.file_uploader("", type=["py", "cpp", "txt"], label_visibility="collapsed")
    if uploaded_file:
        st.session_state.uploaded_file_data = {
            'name': uploaded_file.name,
            'content': uploaded_file.read().decode("utf-8")
        }
        st.rerun()

with col2:
    mic_pressed = st.button("🎤", help="Use voice input", use_container_width=True)

with col3:
    st.write("")  # alignment

# -----------------------------
# ✅ MICROPHONE INPUT
# -----------------------------
if mic_pressed:
    with st.spinner("🎙️ Listening..."):
        try:
            recognizer = sr.Recognizer()
            with sr.Microphone() as source:
                st.info("Speak now...")
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                spoken_text = recognizer.recognize_google(audio)
                st.success(f"✅ Recognized: {spoken_text}")

                user_input = spoken_text
        except Exception as e:
            st.error(f"🎤 Error: {str(e)}")
            user_input = None
else:
    user_input = st.chat_input("Message AI Code Debugger")

# -----------------------------
# ✅ AI RESPONSE
# -----------------------------
if user_input:
    if st.session_state.uploaded_file_data:
        full_input = f"```{st.session_state.uploaded_file_data['name']}\n{st.session_state.uploaded_file_data['content']}\n```\n\n{user_input}"
        st.session_state.uploaded_file_data = None
    else:
        full_input = user_input

    st.session_state.messages.append({"role": "user", "content": full_input})

    with st.chat_message("assistant", avatar="🤖"):
        with st.spinner("Analyzing your code... 🧩"):
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "system", "content": SYSTEM_PROMPT}, *st.session_state.messages],
                    temperature=0.3,
                )
                reply = response.choices[0].message.content
            except Exception as e:
                reply = f"⚠️ **Error:** {str(e)}"

            st.markdown(reply)

    st.session_state.messages.append({"role": "assistant", "content": reply})
    st.session_state.chat_history[st.session_state.current_chat] = st.session_state.messages
    st.rerun()
