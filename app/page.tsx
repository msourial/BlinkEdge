import { CameraBackdrop } from "./components/CameraBackdrop";
import { Scoreboard } from "./components/Scoreboard";
import { OddsMatrix } from "./components/OddsMatrix";
import { ConsensusIndicator } from "./components/ConsensusIndicator";
import { MockHedgeModal } from "./components/MockHedgeModal";
import { TxLineProvider } from "@/lib/txline/TxLineProvider";

export default function Home() {
  return (
    <TxLineProvider>
      <main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-canvas">
        {/* z0 — Camera video feed (opaque, direct child of shell) */}
        <CameraBackdrop />

        {/* z20 — HUD widgets (translucent, direct siblings of video — NOT wrapped in scrim) */}
        <Scoreboard />
        <OddsMatrix />
        <ConsensusIndicator />

        {/* z30 — RiskAlertSheet (Phase 3a — placeholder) */}
        {/* z40 — BlinkHedgeCard / MockHedgeModal */}
        <MockHedgeModal />
        {/* z50 — Permission/wallet modals (placeholder) */}
      </main>
    </TxLineProvider>
  );
}
