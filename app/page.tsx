import { CameraBackdrop } from "./components/CameraBackdrop";
import { Scoreboard } from "./components/Scoreboard";
import { OddsMatrix } from "./components/OddsMatrix";
import { ConsensusIndicator } from "./components/ConsensusIndicator";
import { HedgeFlow } from "./components/HedgeFlow";
import { WalletProvider } from "./components/WalletProvider";
import { TxLineProvider } from "@/lib/txline/TxLineProvider";
import { RiskEngineProvider } from "@/lib/risk/RiskEngineProvider";

export default function Home() {
  return (
    <TxLineProvider>
      <RiskEngineProvider>
        <WalletProvider>
          <main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-canvas">
            {/* z0 — Camera video feed (opaque, direct child of shell) */}
            <CameraBackdrop />

            {/* z20 — HUD widgets (translucent, direct siblings of video — NOT wrapped in scrim) */}
            <Scoreboard />
            <OddsMatrix />
            <ConsensusIndicator />

            {/* z30 — RiskAlertSheet + z40 — BlinkHedgeCard */}
            <HedgeFlow />
          </main>
        </WalletProvider>
      </RiskEngineProvider>
    </TxLineProvider>
  );
}