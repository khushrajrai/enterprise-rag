import React, { useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      setAnswer("Error connecting to server.");
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">Enterprise RAG System</h1>
        <p className="subtitle">AI-Powered Document Intelligence</p>

        <div className="input-section">
          <textarea
            placeholder="Ask something about your documents..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <button onClick={askQuestion}>
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>

        {answer && (
          <div className="answer-box">
            <h3>Answer</h3>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;