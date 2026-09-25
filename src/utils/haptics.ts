/**
 * Haptic feedback utility supporting Telegram Mini App WebApp HapticFeedback,
 * Android Vibration API, and iOS tactile triggers.
 */

let hapticsEnabled = true;

try {
  const saved = localStorage.getItem('megatap_haptics_enabled');
  if (saved !== null) {
    hapticsEnabled = saved === 'true';
  }
} catch {
  // Ignore storage errors
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
  try {
    localStorage.setItem('megatap_haptics_enabled', String(enabled));
  } catch {
    // Ignore
  }
}

// Telegram WebApp Haptic helper
function getTelegramHaptics() {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
    return (window as any).Telegram.WebApp.HapticFeedback;
  }
  return null;
}

export function triggerHaptic(pattern: number | number[]): void {
  if (!hapticsEnabled) return;
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers silently ignore
    }
  }
}

// Pre-configured tactile signatures
export const hapticEffects = {
  // Ultra-crisp light tap for normal click
  tap: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.impactOccurred('light'); return; } catch {}
    }
    triggerHaptic(10);
  },
  
  // Double punchy tap for critical strike
  crit: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.impactOccurred('heavy'); return; } catch {}
    }
    triggerHaptic([20, 15, 35]);
  },
  
  // High-frequency buzz for entering Fever mode
  feverStart: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.notificationOccurred('success'); return; } catch {}
    }
    triggerHaptic([30, 20, 40, 20, 60]);
  },
  
  // Continuous rhythm during fever clicks
  feverTap: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.impactOccurred('medium'); return; } catch {}
    }
    triggerHaptic(16);
  },
  
  // Heavy strike impact during boss fight
  bossHit: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.impactOccurred('rigid'); return; } catch {}
    }
    triggerHaptic(40);
  },
  
  // Euphoric victory pattern for slaying a boss
  bossDefeat: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.notificationOccurred('success'); return; } catch {}
    }
    triggerHaptic([50, 30, 50, 30, 80, 40, 120]);
  },
  
  // Level up celebration pattern
  levelUp: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.notificationOccurred('success'); return; } catch {}
    }
    triggerHaptic([30, 25, 45, 25, 70]);
  },
  
  // Clicky feedback for purchasing an upgrade
  purchase: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.impactOccurred('medium'); return; } catch {}
    }
    triggerHaptic([15, 15, 25]);
  },
  
  // Warning or blocked action buzz
  warning: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.notificationOccurred('warning'); return; } catch {}
    }
    triggerHaptic([40, 30, 40, 30, 40]);
  },
  
  // Golden dumpling / secret bonus click
  goldenCatch: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.notificationOccurred('success'); return; } catch {}
    }
    triggerHaptic([30, 20, 50, 20, 80]);
  },
  
  // Prestige reset dramatic rumble
  prestigeReset: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.notificationOccurred('warning'); return; } catch {}
    }
    triggerHaptic([100, 50, 150, 50, 200]);
  },

  // Strong tactile pulse for deals and soulslike actions
  heavyTap: () => {
    const tg = getTelegramHaptics();
    if (tg) {
      try { tg.impactOccurred('heavy'); return; } catch {}
    }
    triggerHaptic([50, 30, 50]);
  },
};
