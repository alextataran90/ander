import { useCallback } from "react";

type HapticType = "light" | "medium" | "heavy";

export function useHaptic() {
  const triggerHaptic = useCallback((type: HapticType = "light") => {
    // Check if vibration is supported
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }, []);

  return { triggerHaptic };
}
