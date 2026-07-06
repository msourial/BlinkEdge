import { useEffect } from "react";

class BlurBudgetManager {
  private active = 0;
  private readonly max = 3;
  private autoDowngrade: boolean;

  constructor() {
    if (typeof navigator !== "undefined") {
      const cores = navigator.hardwareConcurrency || 8;
      const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8;
      this.autoDowngrade = cores <= 4 || memory <= 4;
    } else {
      this.autoDowngrade = false;
    }
  }

  acquire(): boolean {
    if (this.autoDowngrade) return false;
    if (this.active >= this.max) return false;
    this.active++;
    return true;
  }

  release(): void {
    this.active = Math.max(0, this.active - 1);
  }
}

export const blurBudget = new BlurBudgetManager();

export function useBlurBudget(): { canBlur: boolean; style: React.CSSProperties } {
  const canBlur = blurBudget.acquire();

  useEffect(() => {
    return () => {
      if (canBlur) blurBudget.release();
    };
  }, [canBlur]);

  return {
    canBlur,
    style: canBlur
      ? {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }
      : { backgroundColor: "rgba(10,10,15,0.55)" },
  };
}
