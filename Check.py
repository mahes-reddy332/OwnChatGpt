import os
from datetime import datetime

import speech_recognition as sr
import streamlit as st
from openai import OpenAI

# -----------------------------
# ✅ CONFIG
# -----------------------------
st.set_page_config(page_title="AI Code Debugger", page_icon="🧠", layout="wide")

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    st.error("OpenAI API key is not configured. Set OPENAI_API_KEY before running the app.")
    st.stop()

client = OpenAI(api_key=api_key)

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
# ✅ MODERN CSS + COLLAPSIBLE SIDEBAR
# -----------------------------
st.markdown("""
<style>
#MainMenu, header, footer {hover:"visibility:none";}

.stApp {
    background: linear-gradient(135deg, #000000 20%, #16213e 50%);
    color: #e4e4e4;
}

.main {
    max-width: 1000px;
    margin: auto;
    padding-bottom:     0px !important;
}

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

.stCodeBlock {
    background-color: #0d1117 !important;
    border-radius: 8px;
    border: 1px solid #30363d;
}

/* Sidebar */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%) !important;
    border-right: 1px solid rgba(255,255,255,0.1);
    color: #e4e4e4 !important;
    width: 280px !important;
    transition: all 0.3s ease-in-out;
    overflow-x: hidden !important;
    padding-top: 0.5rem !important;
}

.sidebar-hidden [data-testid="stSidebar"] {
    margin-left: -300px !important;
}

/* Buttons */
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

/* Upload file */
.upload-indicator {
    background: rgba(16, 163, 127, 0.15);
    border: 1px solid rgba(16, 163, 127, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin: 16px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

h1 {
    background: linear-gradient(135deg, #10a37f 0%, #1e88e5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.stCaption {
    color: #aaa !important;
    font-size: 14px !important;
}

.stSpinner > div {
    border-top-color: #10a37f !important;
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
if "sidebar_visible" not in st.session_state:
    st.session_state.sidebar_visible = True

# -----------------------------
# ✅ COLLAPSIBLE SIDEBAR TOGGLE
# -----------------------------
if st.session_state.sidebar_visible:
    with st.sidebar:
        st.title("💬 Chat History")

        if st.button("➕ New Chat", use_container_width=True):
            st.session_state.current_chat = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            st.session_state.messages = [{"role": "assistant", "content": "Hi 👋! Paste your code here and I'll debug it for you."}]
            st.session_state.uploaded_file_data = None
            st.rerun()

        st.divider()

        for chat_name in reversed(list(st.session_state.chat_history.keys())):
            if st.button(f"🗂️ {chat_name}", key=f"chat_{chat_name}", use_container_width=True):
                st.session_state.messages = st.session_state.chat_history[chat_name]
                st.session_state.current_chat = chat_name
                st.session_state.uploaded_file_data = None
                st.rerun()

        st.divider()
        if st.button("❌ Hide Sidebar", use_container_width=True):
            st.session_state.sidebar_visible = False
            st.rerun()
else:
    if st.button("📂 Show Sidebar"):
        st.session_state.sidebar_visible = True
        st.rerun()

# -----------------------------
# ✅ MAIN CHAT INTERFACE
# -----------------------------
st.title("🧠 AI Code Debugger")
st.caption("Debug Python or C++ code with GPT-4o-mini — by Lokesh 🚀")

# Uploaded file info
if st.session_state.uploaded_file_data:
    st.markdown(f"""
    <div class='upload-indicator'>
        <div class='file-info'>
            <span>📎</span>
            <span><strong>{st.session_state.uploaded_file_data['name']}</strong></span>
            <span style='color: #888;'>({len(st.session_state.uploaded_file_data['content'])} chars)</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

# Display messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"], avatar="🧑‍💻" if msg["role"] == "user" else "🤖"):
        st.markdown(msg["content"])

# -----------------------------
# ✅ INPUT AREA
# -----------------------------
col1, col2, col3 = st.columns([0.8, 0.1, 0.1])

with col1:
    uploaded_file = st.file_uploader("Upload code file", type=["py", "cpp", "txt", "js", "java", "c", "h"], label_visibility="collapsed")
    if uploaded_file and (not st.session_state.uploaded_file_data or st.session_state.uploaded_file_data['name'] != uploaded_file.name):
        st.session_state.uploaded_file_data = {
            'name': uploaded_file.name,
            'content': uploaded_file.read().decode("utf-8")
        }
        st.rerun()

with col2:
    mic_pressed = st.button("🎤", key="mic_btn", help="Use voice input", use_container_width=True)
with col3:
    st.write("")  # Alignment

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

                full_input = spoken_text
                if st.session_state.uploaded_file_data:
                    full_input = f"{st.session_state.uploaded_file_data['content']}\n\n{spoken_text}"
                    st.session_state.uploaded_file_data = None

                st.session_state.messages.append({"role": "user", "content": full_input})

                with st.spinner("Analyzing your code... 🧩"):
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[{"role": "system", "content": SYSTEM_PROMPT}, *st.session_state.messages],
                        temperature=0.3,
                    )
                    reply = response.choices[0].message.content

                st.session_state.messages.append({"role": "assistant", "content": reply})
                st.session_state.chat_history[st.session_state.current_chat] = st.session_state.messages
                st.rerun()

        except sr.WaitTimeoutError:
            st.warning("⏱️ No speech detected. Please try again.")
        except sr.UnknownValueError:
            st.warning("❓ Could not understand audio. Please try again.")
        except Exception as e:
            st.error(f"❌ Microphone error: {str(e)}")

# -----------------------------
# ✅ CHAT INPUT
# -----------------------------
user_input = st.chat_input("Message AI Code Debugger")

if user_input:
    full_input = user_input
    if st.session_state.uploaded_file_data:
        full_input = f"```{st.session_state.uploaded_file_data['name']}\n{st.session_state.uploaded_file_data['content']}\n```\n\n{user_input}"
        st.session_state.uploaded_file_data = None

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
                reply = f"⚠️ **Error:** {str(e)}\n\nPlease check your API key."

            st.markdown(reply)

    st.session_state.messages.append({"role": "assistant", "content": reply})
    st.session_state.chat_history[st.session_state.current_chat] = st.session_state.messages
    st.rerun()
