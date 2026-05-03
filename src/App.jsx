import React, { useMemo, useState } from "react";

const presets = [
  { id: "punch", label: "Punch" },
  { id: "smooth", label: "Smooth" },
  { id: "pop", label: "Pop Words" },
  { id: "cinematic", label: "Cinematic" }
];

const fontStyles = [
  { id: "premium", label: "Premium Sans" },
  { id: "editorial", label: "Editorial Italic" },
  { id: "street", label: "Street Bold" }
];

const sampleText =
  "This is normal text but **these words hit harder** and this part is _italic_ with [red:one dangerous word].";

function parseText(input) {
  const parts = [];
  const regex = /(\*\*.*?\*\*|_.*?_|\[(red|blue|green|yellow|purple|white):(.*?)\])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: input.slice(lastIndex, match.index), type: "normal" });
    }

    const raw = match[0];

    if (raw.startsWith("**")) {
      parts.push({ text: raw.slice(2, -2), type: "highlight" });
    } else if (raw.startsWith("_")) {
      parts.push({ text: raw.slice(1, -1), type: "italic" });
    } else if (raw.startsWith("[")) {
      parts.push({ text: match[3], type: "color", colorName: match[2] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    parts.push({ text: input.slice(lastIndex), type: "normal" });
  }

  return parts.flatMap((part) =>
    part.text.split(/(\s+)/).filter(Boolean).map((word) => ({
      ...part,
      text: word,
      isSpace: /^\s+$/.test(word)
    }))
  );
}

function colorFromName(name, accentColor) {
  const colors = {
    red: "#ff3838",
    blue: "#43a5ff",
    green: "#37ff8b",
    yellow: "#ffe45c",
    purple: "#b86bff",
    white: "#ffffff"
  };

  return colors[name] || accentColor;
}

function Preview({ text, preset, fontStyle, accentColor, baseColor }) {
  const tokens = useMemo(() => parseText(text), [text]);

  return (
    <div className={`phone-frame ${fontStyle}`}>
      <div className={`caption caption-${preset}`}>
        {tokens.map((token, index) => {
          if (token.isSpace) return <span key={index}> </span>;

          const style = {
            "--i": index,
            color:
              token.type === "highlight"
                ? accentColor
                : token.type === "color"
                ? colorFromName(token.colorName, accentColor)
                : baseColor,
            fontStyle: token.type === "italic" ? "italic" : "normal"
          };

          return (
            <span
              key={index}
              className={`word ${
                token.type === "highlight" || token.type === "color" ? "hot" : ""
              }`}
              style={style}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState(sampleText);
  const [preset, setPreset] = useState("punch");
  const [fontStyle, setFontStyle] = useState("premium");
  const [accentColor, setAccentColor] = useState("#ff3838");
  const [baseColor, setBaseColor] = useState("#ffffff");
  const [renderState, setRenderState] = useState("");

  async function renderMp4() {
    setRenderState("Rendering MP4...");

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          preset,
          fontStyle,
          accentColor,
          baseColor,
          seconds: 7
        })
      });

      const data = await response.json();

      if (!data.ok) {
        setRenderState(`Render failed: ${data.error || "Unknown error"}`);
        console.error(data.logs);
        return;
      }

      setRenderState(`Done: ${data.file}`);
      window.open(data.file, "_blank");
    } catch (error) {
      setRenderState(`Render failed: ${error.message}`);
    }
  }

  function downloadProps() {
    const payload = {
      text,
      preset,
      fontStyle,
      accentColor,
      baseColor,
      seconds: 7
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "props.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app">
      <section className="panel">
        <div>
          <p className="eyebrow">Motion Text Generator</p>
          <h1>Animated Reels text on black background</h1>
          <p className="sub">
            Insert text, mark strong words, choose a preset, export MP4.
          </p>
        </div>

        <label>
          Text
          <textarea value={text} onChange={(e) => setText(e.target.value)} />
        </label>

        <div className="hint">
          Highlight: <code>**word**</code> · Italic: <code>_word_</code> · Color:{" "}
          <code>[red:word]</code>
        </div>

        <div className="grid">
          <label>
            Preset
            <select value={preset} onChange={(e) => setPreset(e.target.value)}>
              {presets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Font
            <select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)}>
              {fontStyles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Highlight color
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </label>

          <label>
            Base color
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
            />
          </label>
        </div>

        <div className="actions">
          <button onClick={renderMp4}>Render MP4</button>
          <button className="ghost" onClick={downloadProps}>
            Download props.json
          </button>
        </div>

        {renderState && <p className="status">{renderState}</p>}
      </section>

      <section className="preview-wrap">
        <Preview
          text={text}
          preset={preset}
          fontStyle={fontStyle}
          accentColor={accentColor}
          baseColor={baseColor}
        />
      </section>
    </main>
  );
}
