import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const reset = () => {
    setResult(null);
    setError(null);
    setText("");
    setFile(null);
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === "text") {
        const res = await fetch("http://127.0.0.1:5000/analyze/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResult(data.result);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("http://127.0.0.1:5000/analyze/image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResult(data.result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (v) => {
    if (!v) return "#aaa";
    if (v.includes("AI")) return "#ff4444";
    if (v.includes("Human")) return "#00e676";
    return "#ffbb33";
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>◈ ORIGIN DETECTOR</h1>
          <p>Upload anything. Get the truth.</p>
        </div>

        <div className="toggle">
          <button
            className={mode === "text" ? "active" : ""}
            onClick={() => { setMode("text"); reset(); }}
          >
            ⌨ Paste Text
          </button>
          <button
            className={mode === "file" ? "active" : ""}
            onClick={() => { setMode("file"); reset(); }}
          >
            ⬆ Upload Image
          </button>
        </div>

        {mode === "text" ? (
          <textarea
            placeholder="Paste your text here — essay, email, article..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className="dropzone" onClick={() => fileRef.current.click()}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <p>📎 {file.name}</p>
            ) : (
              <p>Click to upload an image (JPG, PNG, WEBP)</p>
            )}
          </div>
        )}

        <button
          className="scan-btn"
          onClick={analyze}
          disabled={loading || (mode === "text" ? !text.trim() : !file)}
        >
          {loading ? "Analyzing..." : "RUN DETECTION"}
        </button>

        {error && <div className="error">⚠ {error}</div>}

        {result && (
          <div className="result">
            <h2 style={{ color: verdictColor(result.verdict) }}>
              {result.verdict}
            </h2>
            <div className="confidence">
              <span>Confidence</span>
              <span>{result.confidence}%</span>
            </div>
            <div className="bar-bg">
              <div
                className="bar-fill"
                style={{
                  width: `${result.confidence}%`,
                  background: verdictColor(result.verdict),
                }}
              />
            </div>
            <p className="reasoning">{result.reasoning}</p>
            <div className="signals">
              <p>DETECTED SIGNALS</p>
              {result.signals.map((s, i) => (
                <div key={i} className="signal">› {s}</div>
              ))}
            </div>
            <button className="reset-btn" onClick={reset}>↺ Scan Another</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;