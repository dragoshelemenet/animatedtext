import React from "react";
import { registerRoot, Composition } from "remotion";
import { MotionText } from "./MotionText.jsx";

function RemotionRoot() {
  return (
    <Composition
      id="MotionText"
      component={MotionText}
      durationInFrames={210}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        text: "This is normal text but **these words hit harder** and this part is _italic_ with [red:one dangerous word].",
        preset: "punch",
        fontStyle: "premium",
        accentColor: "#ff3838",
        baseColor: "#ffffff",
        seconds: 7
      }}
    />
  );
}

registerRoot(RemotionRoot);
