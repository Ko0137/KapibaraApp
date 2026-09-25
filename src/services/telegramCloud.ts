import { getTelegramWebApp } from '../utils/telegram';
import { GameSaveData } from '../types/game';

const KEY = 'game_save_v2';

export const saveToTelegramCloud = async (data: GameSaveData): Promise<void> => {
  const tg = getTelegramWebApp();
  if (!tg || !tg.CloudStorage) return;
  return new Promise((resolve) => {
    tg.CloudStorage.setItem(KEY, JSON.stringify(data), () => {
      resolve();
    });
  });
};

export const loadFromTelegramCloud = async (): Promise<GameSaveData | null> => {
  const tg = getTelegramWebApp();
  if (!tg || !tg.CloudStorage) return null;
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
};
