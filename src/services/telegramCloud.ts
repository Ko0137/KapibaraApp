import { getTelegramWebApp } from '../utils/telegram';
import { GameSaveData } from '../types/game';

const KEY = 'game_save_v2';

export const saveToTelegramCloud = async (data: GameSaveData): Promise<void> => {
  const tg = getTelegramWebApp();
  if (!tg || !tg.CloudStorage) return;
  try {
    // Check version if possible, or just wrap in try/catch to be safe
    if (tg.version && parseFloat(tg.version) < 6.9) return; 

    return new Promise((resolve) => {
      tg.CloudStorage.setItem(KEY, JSON.stringify(data), () => {
        resolve();
      });
    });
  } catch (e) {
    console.warn('CloudStorage not supported:', e);
  }
};

export const loadFromTelegramCloud = async (): Promise<GameSaveData | null> => {
  const tg = getTelegramWebApp();
  if (!tg || !tg.CloudStorage) return null;
  try {
    if (tg.version && parseFloat(tg.version) < 6.9) return null;

    return new Promise((resolve) => {
      tg.CloudStorage.getItem(KEY, (err: any, res: any) => {
        if (res) {
          try {
            resolve(JSON.parse(res));
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  } catch (e) {
    console.warn('CloudStorage not supported:', e);
    return null;
  }
};
