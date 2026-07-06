import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: "#0a0a0f",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00f0ff",
          borderRadius: "40px",
          border: "4px solid #00f0ff",
          boxShadow: "0 0 40px rgba(0,240,255,0.45)",
        }}
      >
        B
      </div>
    ),
    {
      ...size,
    }
  );
}
