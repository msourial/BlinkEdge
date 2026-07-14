"use client";

type FlagSpec = { type: "horizontal" | "vertical" | "cross" | "solid"; colors: string[]; accent?: string };

const FLAGS: Record<string, FlagSpec> = {
  AR: { type: "horizontal", colors: ["#74acdf", "#ffffff", "#74acdf"], accent: "#f6b40e" },
  BE: { type: "vertical", colors: ["#191919", "#fdda24", "#ef3340"] },
  BR: { type: "solid", colors: ["#009b3a"], accent: "#ffdf00" },
  CH: { type: "cross", colors: ["#d52b1e"], accent: "#ffffff" },
  DE: { type: "horizontal", colors: ["#151515", "#dd0000", "#ffce00"] },
  ES: { type: "horizontal", colors: ["#aa151b", "#f1bf00", "#aa151b"] },
  FR: { type: "vertical", colors: ["#002395", "#ffffff", "#ed2939"] },
  "GB-ENG": { type: "cross", colors: ["#ffffff"], accent: "#ce1126" },
  "GB-SCT": { type: "solid", colors: ["#0065bd"], accent: "#ffffff" },
  JP: { type: "solid", colors: ["#ffffff"], accent: "#bc002d" },
  MA: { type: "solid", colors: ["#c1272d"], accent: "#006233" },
  NO: { type: "cross", colors: ["#ba0c2f"], accent: "#ffffff" },
  PY: { type: "horizontal", colors: ["#d52b1e", "#ffffff", "#0038a8"] },
};

function FlagArtwork({ spec }: { spec: FlagSpec }) {
  if (spec.type === "vertical") return <>{spec.colors.map((color, index) => <rect key={`${color}-${index}`} x={index * 10} width="10" height="20" fill={color} />)}</>;
  if (spec.type === "horizontal") return <>{spec.colors.map((color, index) => <rect key={`${color}-${index}`} y={index * (20 / spec.colors.length)} width="30" height={20 / spec.colors.length} fill={color} />)}</>;
  if (spec.type === "cross") return <><rect width="30" height="20" fill={spec.colors[0]} /><rect x="11" width="8" height="20" fill={spec.accent} /><rect y="6" width="30" height="8" fill={spec.accent} />{spec.colors[0] === "#ba0c2f" && <><rect x="13" width="4" height="20" fill="#00205b" /><rect y="8" width="30" height="4" fill="#00205b" /></>}</>;
  return <><rect width="30" height="20" fill={spec.colors[0]} />{spec.accent && <circle cx="15" cy="10" r="5" fill={spec.accent} />}{spec.colors[0] === "#009b3a" && <path d="M15 3 23 10 15 17 7 10Z" fill="#ffdf00" />}{spec.colors[0] === "#c1272d" && <path d="m15 5 1.5 3.1 3.4.4-2.5 2.3.7 3.3-3.1-1.7-3.1 1.7.7-3.3-2.5-2.3 3.4-.4Z" fill="#006233" />}</>;
}

export function CountryFlag({ code, country }: { code?: string; country: string }) {
  const spec = FLAGS[code ?? ""] ?? { type: "solid", colors: ["#334155"], accent: "#94a3b8" } as FlagSpec;
  return (
    <span className="inline-flex h-6 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-white/15 bg-slate-900 shadow-sm" role="img" aria-label={`${country} flag`} title={`${country} flag`}>
      <svg viewBox="0 0 30 20" className="h-full w-full" aria-hidden="true"><FlagArtwork spec={spec} /></svg>
    </span>
  );
}
