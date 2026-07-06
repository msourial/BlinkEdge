import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 28,
          background: "#0a0a0f",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00f0ff",
          borderRadius: "8px",
          border: "2px solid #00f0ff",
          boxShadow: "0 0 12px rgba(0,240,255,0.45)",
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
