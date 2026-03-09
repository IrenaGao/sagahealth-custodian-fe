import React from "react";

// iPhone 16 screen dimensions
const SCREEN_W = 393;
const SCREEN_H = 852;

// Bezel sizes (px)
const BEZEL_X = 10;
const BEZEL_TOP = 12;
const BEZEL_BOTTOM = 24;

const PHONE_W = SCREEN_W + BEZEL_X * 2; // 413
const PHONE_H = SCREEN_H + BEZEL_TOP + BEZEL_BOTTOM; // 888

const OUTER_RADIUS = 52;
const SCREEN_RADIUS = 44;

const FRAME_BG = "linear-gradient(160deg, #3a3a3c 0%, #1c1c1e 40%, #2a2a2c 100%)";
const BTN_BG = "linear-gradient(to right, #161618, #2c2c2e)";
const BTN_BG_R = "linear-gradient(to left, #161618, #2c2c2e)";

export function MobileWebFrame() {
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    function updateScale() {
      const pad = 32;
      const s = Math.min(
        1,
        (window.innerHeight - pad) / PHONE_H,
        (window.innerWidth - pad) / PHONE_W
      );
      setScale(s);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  if (typeof window === "undefined" || window.self !== window.top) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #c8c8d0 0%, #e4e4ea 50%, #d0d0d8 100%)",
      }}
    >
      {/* Zoom wrapper — scales the entire phone including buttons */}
      <div style={{ position: "relative", zoom: scale } as React.CSSProperties}>

        {/* Action button (left top) */}
        <div style={{ position: "absolute", left: -4, top: 88, width: 4, height: 18, background: BTN_BG, borderRadius: "3px 0 0 3px" }} />
        {/* Volume up */}
        <div style={{ position: "absolute", left: -4, top: 128, width: 4, height: 30, background: BTN_BG, borderRadius: "3px 0 0 3px" }} />
        {/* Volume down */}
        <div style={{ position: "absolute", left: -4, top: 172, width: 4, height: 30, background: BTN_BG, borderRadius: "3px 0 0 3px" }} />
        {/* Power / side button */}
        <div style={{ position: "absolute", right: -4, top: 144, width: 4, height: 62, background: BTN_BG_R, borderRadius: "0 3px 3px 0" }} />

        {/* Phone body */}
        <div
          style={{
            width: PHONE_W,
            height: PHONE_H,
            borderRadius: OUTER_RADIUS,
            background: FRAME_BG,
            padding: `${BEZEL_TOP}px ${BEZEL_X}px ${BEZEL_BOTTOM}px`,
            boxSizing: "border-box",
            boxShadow: [
              "0 0 0 0.5px #606060",
              "inset 0 0 0 0.5px rgba(255,255,255,0.07)",
              "0 60px 140px rgba(0,0,0,0.5)",
              "0 16px 48px rgba(0,0,0,0.3)",
            ].join(", "),
            position: "relative",
          } as React.CSSProperties}
        >
          {/* Screen area */}
          <div
            style={{
              width: SCREEN_W,
              height: SCREEN_H,
              borderRadius: SCREEN_RADIUS,
              overflow: "hidden",
              position: "relative",
              background: "#000",
            }}
          >
            {/* App iframe */}
            <iframe
              src={window.location.href}
              title="Mobile Preview"
              style={{ width: SCREEN_W, height: SCREEN_H, border: "none", display: "block" }}
            />

            {/* Dynamic Island — overlaid on top of iframe */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                width: 126,
                height: 36,
                background: "#000",
                borderRadius: 20,
                zIndex: 10,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
