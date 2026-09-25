/**
 * Anti-Cheat & Click Rate-Limiter Engine for MegaTap
 * Protects against autoclickers, console memory injection, and inhuman tap speeds.
 */

interface ClickRecord {
  timestamp: number;
}

class AntiCheatEngine {
  private clickHistory: ClickRecord[] = [];
  private intervals: number[] = [];
  private lastClickTime: number = 0;
  private violationCount: number = 0;
  private isBotSuspect: boolean = false;
  private readonly MAX_WINDOW_MS = 1000;
  private readonly HUMAN_MAX_CPS = 30; // 30 taps/sec accommodates fast 4-finger multi-touch
  private readonly BOT_HARD_CPS = 45;   // Inhuman CPS threshold

  /**
   * Evaluates each tap event.
   * Returns:
   * - allowed: whether the tap should generate score
   * - multiplier: scale factor (diminished if suspicious speed)
   * - warning: error message if suspicious
   */
  public registerTap(isTrustedEvent: boolean = true): {
    allowed: boolean;
    multiplier: number;
    warning?: string;
  } {
    const now = performance.now();

    // Check 1: Synthetic event check (e.g. element.click() or dispatchEvent without user interaction)
    if (!isTrustedEvent) {
      this.violationCount++;
      return { allowed: false, multiplier: 0, warning: 'Синтетическое нажатие заблокировано!' };
    }

    // Clean up window older than 1 second
    this.clickHistory = this.clickHistory.filter(c => now - c.timestamp < this.MAX_WINDOW_MS);
    this.clickHistory.push({ timestamp: now });

    const currentCPS = this.clickHistory.length;

    // Check 2: Absolute Inhuman Rate Limit
    if (currentCPS > this.BOT_HARD_CPS) {
      this.violationCount += 2;
      return { allowed: false, multiplier: 0, warning: 'Слишком быстро! Обнаружен автокликер (CPS > 45)' };
    }

    // Check 3: Interval Jitter Analysis (Detects robotic constant click delays like exactly 25.0ms)
    if (this.lastClickTime > 0) {
      const delta = now - this.lastClickTime;
      this.intervals.push(delta);
      if (this.intervals.length > 20) {
        this.intervals.shift();
        
        // Calculate standard deviation of intervals
        const avg = this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length;
        const variance = this.intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / this.intervals.length;
        const stdDev = Math.sqrt(variance);

        // Robotic macros usually have stdDev < 1.8ms at high speed
        if (stdDev < 1.5 && avg < 60) {
          this.isBotSuspect = true;
          this.violationCount++;
          return { allowed: true, multiplier: 0.1, warning: 'Обнаружен подозрительно ровный темп нажатий!' };
        } else {
          this.isBotSuspect = false;
        }
      }
    }

    this.lastClickTime = now;

    // Check 4: Soft cap throttle for very high human CPS (between 24 and 30)
    if (currentCPS > this.HUMAN_MAX_CPS) {
      return { allowed: true, multiplier: 0.6, warning: 'Лимит скорости нажатий: доход снижен' };
    }

    return { allowed: true, multiplier: 1.0 };
  }

  /**
   * Validates if score values are mathematically plausible
   * based on level, prestige, and estimated game bounds.
   */
  public validateScorePlausibility(
    totalCoins: number,
    level: number,
    prestige: number
  ): { isPlausible: boolean; reason?: string } {
    if (totalCoins < 0 || isNaN(totalCoins) || !isFinite(totalCoins)) {
      return { isPlausible: false, reason: 'Некорректное значение монет (NaN / Infinity)' };
    }

    if (level < 1 || level > 500) {
      return { isPlausible: false, reason: 'Уровень вне допустимого диапазона' };
    }

    // Exponential plausibility ceiling:
    // Level 1-20 cannot legitimately have 10^15 coins without high prestige
    const maxAllowedCeiling = Math.pow(10, Math.min(25, 4 + (level * 0.25) + (prestige * 2.5)));
    if (totalCoins > maxAllowedCeiling) {
      return { isPlausible: false, reason: 'Аномально высокое количество монет для данного уровня!' };
    }

    return { isPlausible: true };
  }

  /**
   * Generates client integrity token for Firebase Leaderboard
   */
  public generateIntegrityHash(userId: string, coins: number, level: number, prestige: number): string {
    const raw = `${userId}:${Math.floor(coins)}:${level}:${prestige}:MEGATAP_SALT_2026`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  public isFairPlay(): boolean {
    return this.violationCount < 10 && !this.isBotSuspect;
  }

  public resetViolations(): void {
    this.violationCount = 0;
    this.isBotSuspect = false;
  }
}

export const antiCheat = new AntiCheatEngine();
