import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";
const ALLOWED_EXTENSIONS = [".txt", ".pdf"];
const GITHUB_URL = "https://github.com/khushrajrai";
const LINKEDIN_URL = "https://linkedin.com/in/khushrajrai";

function GitHubIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function LinkedInIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
    </svg>
  );
}

function App() {
  const [contactOpen, setContactOpen] = useState(false);
  const contactRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contactRef.current && !contactRef.current.contains(e.target)) {
        setContactOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [file, setFile] = useState(null);
  const [docStatus, setDocStatus] = useState("idle"); // idle | uploading | ready | error
  const [docError, setDocError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);

  const fileInputRef = useRef(null);

  const isValidFile = (candidate) => {
    if (!candidate) return false;
    const name = candidate.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  };

  const uploadFile = async (selected) => {
    if (!isValidFile(selected)) {
      setDocStatus("error");
      setDocError("Only .txt and .pdf files are supported.");
      return;
    }

    setFile(selected);
    setDocStatus("uploading");
    setDocError("");
    setMessages([]);

    const formData = new FormData();
    formData.append("file", selected);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setDocStatus("ready");
    } catch (error) {
      setDocStatus("error");
      setDocError("Could not process this document. Please try again.");
    }
  };

  const handleFileInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) uploadFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) uploadFile(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeDocument = () => {
    setFile(null);
    setDocStatus("idle");
    setDocError("");
    setMessages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const askQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed || docStatus !== "ready" || asking) return;

    // Recent turns only (excludes the question we're about to send)
    const recentHistory = messages
      .slice(-6)
      .map(({ role, text }) => ({ role, text }));

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setAsking(true);

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history: recentHistory }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer || "No answer returned." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error connecting to server.", isError: true },
      ]);
    }

    setAsking(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const statusLabel = {
    idle: "No document uploaded",
    uploading: "Processing document…",
    ready: "Document ready — ask away",
    error: docError || "Something went wrong",
  }[docStatus];

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/favicon.ico" alt="Enterprise-RAG logo" className="navbar-logo" />
          <span className="navbar-name">Enterprise-RAG</span>
        </div>

        <div className="navbar-contact" ref={contactRef}>
          <button
            className="contact-btn"
            onClick={() => setContactOpen((prev) => !prev)}
          >
            Developer Contact
            <span className={`chevron ${contactOpen ? "open" : ""}`}>▾</span>
          </button>

          {contactOpen && (
            <div className="contact-dropdown">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <GitHubIcon className="contact-icon" /> GitHub
              </a>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <LinkedInIcon className="contact-icon" /> LinkedIn
              </a>
            </div>
          )}
        </div>
      </nav>

      <div className="shell">
        <header className="header">
          <h1 className="title">Enterprise RAG System</h1>
          <p className="subtitle">Upload a document and ask anything about it</p>
        </header>

        <div className="layout">
          {/* Upload panel */}
          <section className="panel upload-panel">
            <h2 className="panel-title">📄 Document</h2>

            <div
              className={`dropzone ${isDragging ? "dragging" : ""} ${
                docStatus === "ready" ? "has-file" : ""
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileInputChange}
                hidden
              />
              <div className="dropzone-icon">⬆️</div>
              <p className="dropzone-text">
                Drag & drop a <strong>.txt</strong> or <strong>.pdf</strong> file here
              </p>
              <p className="dropzone-subtext">or click to browse</p>
            </div>

            {file && (
              <div className="file-card">
                <div className="file-info">
                  <span className="file-icon">
                    {file.name.toLowerCase().endsWith(".pdf") ? "📕" : "📃"}
                  </span>
                  <span className="file-name" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button className="remove-btn" onClick={removeDocument}>
                  ✕
                </button>
              </div>
            )}

            <div className={`status-badge status-${docStatus}`}>
              {docStatus === "uploading" && <span className="spinner" />}
              <span>{statusLabel}</span>
            </div>
          </section>

          {/* Chat panel */}
          <section className="panel chat-panel">
            <h2 className="panel-title">💬 Ask your document</h2>

            <div className="chat-window">
              {messages.length === 0 && (
                <div className="empty-chat">
                  {docStatus === "ready"
                    ? "Your document is ready. Ask your first question below."
                    : "Upload a document to start the conversation."}
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`bubble-row ${msg.role}`}>
                  <div className={`bubble ${msg.role} ${msg.isError ? "error" : ""}`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {asking && (
                <div className="bubble-row assistant">
                  <div className="bubble assistant typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}
            </div>

            <div className="composer">
              <textarea
                placeholder={
                  docStatus === "ready"
                    ? "Ask something about your document…"
                    : "Upload a document first to start asking questions"
                }
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={docStatus !== "ready"}
              />
              <button
                className="send-btn"
                onClick={askQuestion}
                disabled={docStatus !== "ready" || !question.trim() || asking}
              >
                {asking ? "Thinking…" : "Send"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
