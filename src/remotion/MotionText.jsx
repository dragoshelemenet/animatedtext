import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

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

function fontFamily(fontStyle) {
  if (fontStyle === "editorial") return "Georgia, Times New Roman, serif";
  if (fontStyle === "street") return "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif";
  return "Inter, Arial, sans-serif";
}

export function MotionText({
  text,
  preset,
  fontStyle,
  accentColor,
  baseColor
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tokens = parseText(text);

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        justifyContent: "center",
        alignItems: "center",
        padding: 110
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontFamily: fontFamily(fontStyle),
          fontSize: fontStyle === "street" ? 128 : 118,
          lineHeight: 0.93,
          letterSpacing: fontStyle === "street" ? "-0.035em" : "-0.075em",
          fontWeight: 950,
          textTransform: fontStyle === "street" ? "uppercase" : "none",
          maxWidth: 900
        }}
      >
        {tokens.map((token, index) => {
          if (token.isSpace) return <span key={index}> </span>;

          const delay = index * 2.2;
          const localFrame = frame - delay;

          const soft = interpolate(localFrame, [0, 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });

          const bounce = spring({
            frame: localFrame,
            fps,
            config: {
              damping: preset === "pop" ? 8 : 16,
              stiffness: preset === "pop" ? 180 : 130,
              mass: 0.55
            }
          });

          const opacity = interpolate(localFrame, [0, 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });

          let y = interpolate(soft, [0, 1], [55, 0]);
          let scale = interpolate(soft, [0, 1], [0.92, 1]);

          if (preset === "pop") {
            scale = interpolate(bounce, [0, 1], [0.55, 1]);
          }

          if (preset === "cinematic") {
            y = interpolate(soft, [0, 1], [90, 0]);
            scale = interpolate(soft, [0, 1], [1.1, 1]);
          }

          const color =
            token.type === "highlight"
              ? accentColor
              : token.type === "color"
              ? colorFromName(token.colorName, accentColor)
              : baseColor;

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                opacity,
                transform: `translateY(${y}px) scale(${scale})`,
                color,
                fontStyle: token.type === "italic" ? "italic" : "normal",
                textShadow:
                  token.type === "highlight" || token.type === "color"
                    ? `0 0 42px ${color}`
                    : "none",
                filter:
                  preset === "cinematic"
                    ? `blur(${interpolate(soft, [0, 1], [12, 0])}px)`
                    : "none"
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
