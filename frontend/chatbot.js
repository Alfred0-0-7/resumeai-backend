/**
 * ResumeAI – Career Advisor Chatbot
 * Floating chatbot on every page powered by Groq API via backend
 */
(function () {

    // ── Inject HTML ──────────────────────────────────────────────
    const chatHTML = `
    <div id="chatWidget">
        <button id="chatToggle" title="Career Advisor">
            <span id="chatToggleIcon">💬</span>
        </button>
        <div id="chatBox">
            <div id="chatHeader">
                <div id="chatHeaderLeft">
                    <div id="chatAvatar">🎯</div>
                    <div>
                        <div id="chatName">Career Advisor</div>
                        <div id="chatStatus">
                            <span id="chatStatusDot"></span>
                            Online
                        </div>
                    </div>
                </div>
                <button id="chatClose">✕</button>
            </div>
            <div id="chatMessages">
                <div class="chat-msg bot">
                    <div class="chat-bubble">
                        👋 Hi! I'm your AI Career Advisor. I can help you with:<br><br>
                        • Resume tips & improvements<br>
                        • Career path guidance<br>
                        • Interview preparation<br>
                        • Job search strategies<br>
                        • Salary negotiation<br><br>
                        What would you like help with today?
                    </div>
                </div>
            </div>
            <div id="chatSuggestions">
                <button class="chat-suggestion" onclick="sendSuggestion('How can I improve my resume?')">Improve resume</button>
                <button class="chat-suggestion" onclick="sendSuggestion('What jobs suit a Python developer?')">Job suggestions</button>
                <button class="chat-suggestion" onclick="sendSuggestion('How do I prepare for interviews?')">Interview tips</button>
                <button class="chat-suggestion" onclick="sendSuggestion('What is a good salary for a fresher in India?')">Salary guide</button>
            </div>
            <div id="chatInputArea">
                <textarea id="chatInput" placeholder="Ask me anything about your career..." rows="1"></textarea>
                <button id="chatSend">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // ── Inject CSS ───────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
    #chatWidget {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9999;
        font-family: 'Inter', sans-serif;
    }
    #chatToggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #6c5ce7, #a855f7);
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 24px rgba(108,92,231,0.5);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    #chatToggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 32px rgba(108,92,231,0.7);
    }
    #chatBox {
        display: none;
        flex-direction: column;
        position: absolute;
        bottom: 75px;
        right: 0;
        width: 370px;
        height: 540px;
        background: #12121a;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: chatSlideIn 0.3s ease;
    }
    #chatBox.open {
        display: flex;
    }
    @keyframes chatSlideIn {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    #chatHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        background: linear-gradient(135deg, rgba(108,92,231,0.2), rgba(168,85,247,0.1));
        border-bottom: 1px solid rgba(255,255,255,0.06);
        flex-shrink: 0;
    }
    #chatHeaderLeft {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    #chatAvatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6c5ce7, #a855f7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
    }
    #chatName {
        font-weight: 700;
        font-size: 0.95rem;
        color: #f0f0f5;
    }
    #chatStatus {
        font-size: 0.72rem;
        color: #22c55e;
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 2px;
    }
    #chatStatusDot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #22c55e;
        animation: pulse-dot 2s ease infinite;
    }
    #chatClose {
        background: transparent;
        border: none;
        color: #8a8a9a;
        font-size: 1rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.2s;
    }
    #chatClose:hover { background: rgba(255,255,255,0.06); color: #f0f0f5; }
    #chatMessages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .chat-msg {
        display: flex;
        align-items: flex-end;
        gap: 8px;
    }
    .chat-msg.user { flex-direction: row-reverse; }
    .chat-bubble {
        max-width: 82%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 0.84rem;
        line-height: 1.6;
        color: #f0f0f5;
    }
    .chat-msg.bot .chat-bubble {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.07);
        border-bottom-left-radius: 4px;
    }
    .chat-msg.user .chat-bubble {
        background: linear-gradient(135deg, #6c5ce7, #a855f7);
        border-bottom-right-radius: 4px;
    }
    .chat-typing {
        display: flex;
        gap: 5px;
        padding: 12px 16px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        width: fit-content;
    }
    .chat-typing span {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #a855f7;
        animation: typing-bounce 1.2s ease infinite;
    }
    .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
    .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing-bounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30%            { transform: translateY(-6px); opacity: 1; }
    }
    #chatSuggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 12px;
        border-top: 1px solid rgba(255,255,255,0.04);
        flex-shrink: 0;
    }
    .chat-suggestion {
        padding: 5px 12px;
        border-radius: 50px;
        background: rgba(108,92,231,0.1);
        border: 1px solid rgba(108,92,231,0.25);
        color: #a78bfa;
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Inter', sans-serif;
    }
    .chat-suggestion:hover {
        background: rgba(108,92,231,0.2);
        border-color: rgba(108,92,231,0.5);
    }
    #chatInputArea {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 12px 14px;
        border-top: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.02);
        flex-shrink: 0;
    }
    #chatInput {
        flex: 1;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 10px 14px;
        color: #f0f0f5;
        font-family: 'Inter', sans-serif;
        font-size: 0.84rem;
        resize: none;
        outline: none;
        max-height: 100px;
        overflow-y: auto;
        line-height: 1.5;
        transition: border-color 0.2s;
    }
    #chatInput:focus { border-color: rgba(108,92,231,0.4); }
    #chatInput::placeholder { color: #55556a; }
    #chatSend {
        width: 38px; height: 38px;
        border-radius: 10px;
        background: linear-gradient(135deg, #6c5ce7, #a855f7);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s;
    }
    #chatSend:hover { transform: scale(1.05); }
    #chatSend:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    `;
    document.head.appendChild(style);

    // ── State ────────────────────────────────────────────────────
    const messages = [];
    let isOpen = false;
    let isLoading = false;

    // ── Elements ─────────────────────────────────────────────────
    const chatBox      = document.getElementById('chatBox');
    const chatToggle   = document.getElementById('chatToggle');
    const chatClose    = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput    = document.getElementById('chatInput');
    const chatSend     = document.getElementById('chatSend');
    const chatSuggestions = document.getElementById('chatSuggestions');

    // ── Toggle Open/Close ────────────────────────────────────────
    chatToggle.addEventListener('click', () => {
        isOpen = !isOpen;
        chatBox.classList.toggle('open', isOpen);
        document.getElementById('chatToggleIcon').textContent = isOpen ? '✕' : '💬';
        if (isOpen) {
            chatInput.focus();
            scrollToBottom();
        }
    });

    chatClose.addEventListener('click', () => {
        isOpen = false;
        chatBox.classList.remove('open');
        document.getElementById('chatToggleIcon').textContent = '💬';
    });

    // ── Send Message ─────────────────────────────────────────────
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || isLoading) return;

        // Hide suggestions after first message
        chatSuggestions.style.display = 'none';

        // Add user message
        addMessage('user', text);
        messages.push({ role: 'user', content: text });
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Show typing
        const typingEl = showTyping();
        isLoading = true;
        chatSend.disabled = true;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });

            const data = await res.json();
            typingEl.remove();

            if (!res.ok) throw new Error(data.detail || 'Failed to get response');

            const reply = data.reply;
            messages.push({ role: 'assistant', content: reply });
            addMessage('bot', reply);

        } catch (err) {
            typingEl.remove();
            addMessage('bot', '⚠️ Sorry, I could not connect. Please try again.');
        } finally {
            isLoading = false;
            chatSend.disabled = false;
            chatInput.focus();
        }
    }

    window.sendSuggestion = function(text) {
        chatInput.value = text;
        sendMessage();
    };

    // ── UI Helpers ───────────────────────────────────────────────
    function addMessage(role, text) {
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        div.innerHTML = `<div class="chat-bubble">${formatText(text)}</div>`;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        div.innerHTML = `<div class="chat-typing"><span></span><span></span><span></span></div>`;
        chatMessages.appendChild(div);
        scrollToBottom();
        return div;
    }

    function scrollToBottom() {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }

    function formatText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

})();