import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a retirement plan participant education assistant. Your job is to answer participant questions about their 401(k) or retirement plan in clear, plain language — no jargon, no legal disclaimers beyond what is necessary, no confusion.

You help participants understand:
- How their 401(k) or 403(b) plan works
- Contribution limits and how to change their contribution rate
- Employer match rules and how to maximize them
- Vesting schedules and what they mean
- Investment options and basic concepts (diversification, target date funds, risk tolerance)
- Loans and hardship withdrawals — how they work, pros and cons
- What happens to their account when they leave a job
- RMDs (Required Minimum Distributions) and when they apply
- Beneficiary designations and why they matter
- How to read their account statement

You do NOT provide personalized investment advice. You do NOT tell participants what specific investments to choose. You DO explain concepts clearly so participants can make informed decisions.

Always respond in plain, warm, conversational English. Assume the participant has no financial background. If a question is outside the scope of retirement plans, gently redirect back to plan-related topics.

Keep responses concise — 2 to 4 short paragraphs maximum unless the question genuinely requires more detail. Use bullet points sparingly and only when listing distinct items.`;

const STARTER_QUESTIONS = [
  "How does my employer match work?",
  "What's the difference between traditional and Roth 401(k)?",
  "Can I take a loan from my 401(k)?",
  "What happens to my account if I leave my job?",
  "How do I change my contribution rate?",
  "What is a vesting schedule?",
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deflectedCalls, setDeflectedCalls] = useState(0);
  const [savedAmount, setSavedAmount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const assistantText = data.content?.[0]?.text || "I'm sorry, I couldn't process that. Please try again.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantText },
      ]);

      const newDeflected = deflectedCalls + 1;
      setDeflectedCalls(newDeflected);
      setSavedAmount(Math.round(newDeflected * 8.5));
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand-slot">
          <div className="brand-placeholder">
            <span className="brand-icon">⬜</span>
            <span className="brand-label">Your Logo Here</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Plan Assistant</p>
          <p className="sidebar-desc">
            Ask any question about your retirement plan. Plain answers, no jargon.
          </p>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          <p className="sidebar-label">Quick Topics</p>
          <ul className="topic-list">
            {["Contributions", "Employer Match", "Investments", "Loans", "Withdrawals", "Beneficiaries"].map((t) => (
              <li
                key={t}
                className="topic-item"
                onClick={() => sendMessage(`Tell me about ${t.toLowerCase()} in my retirement plan`)}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section metrics-section">
          <p className="sidebar-label">Session Impact</p>
          <div className="metric-card">
            <span className="metric-value">{deflectedCalls}</span>
            <span className="metric-desc">calls deflected</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">${savedAmount.toLocaleString()}</span>
            <span className="metric-desc">est. cost saved</span>
          </div>
          <p className="metric-note">Based on avg. $8.50/call center interaction</p>
        </div>
      </aside>

      <main className="chat-pane">
        <header className="chat-header">
          <div>
            <h1 className="chat-title">Retirement Plan Assistant</h1>
            <p className="chat-subtitle">Get plain-language answers to your plan questions</p>
          </div>
          <div className="status-badge">
            <span className="status-dot" />
            Available now
          </div>
        </header>

        <div className="messages-area">
          {messages.length === 0 && (
            <div className="welcome-state">
              <div className="welcome-icon">💬</div>
              <h2 className="welcome-title">What would you like to know about your plan?</h2>
              <p className="welcome-sub">Choose a common question or type your own below.</p>
              <div className="starter-grid">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    className="starter-btn"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`message-row ${m.role}`}>
              {m.role === "assistant" && (
                <div className="avatar assistant-avatar">PA</div>
              )}
              <div className={`bubble ${m.role}`}>
                {m.content.split("\n").map((line, j) => (
                  <p key={j} className="bubble-line">{line}</p>
                ))}
              </div>
              {m.role === "user" && (
                <div className="avatar user-avatar">You</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="avatar assistant-avatar">PA</div>
              <div className="bubble assistant typing-bubble">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows={1}
            placeholder="Ask a question about your retirement plan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
        <p className="disclaimer">
          This assistant provides general plan education only — not personalized investment or legal advice.
        </p>
      </main>
    </div>
  );
}
