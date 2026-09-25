export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  return null;
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user as TelegramUser;
  }
  return null;
}

export function initTelegramApp(): { user: TelegramUser | null; isTelegram: boolean } {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }
    } catch (e) {
      console.warn('Telegram WebApp init warning:', e);
    }
    const user = getTelegramUser();
    return { user, isTelegram: true };
  }
  return { user: null, isTelegram: false };
}

export function triggerTelegramHaptic(type: 'impact' | 'notification' | 'selection' = 'impact') {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    try {
      if (type === 'impact') {
        tg.HapticFeedback.impactOccurred('medium');
      } else if (type === 'notification') {
        tg.HapticFeedback.notificationOccurred('success');
      } else if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      }
    } catch (e) {
      // ignore
    }
  }
}
