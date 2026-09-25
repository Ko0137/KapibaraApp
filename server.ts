import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Express static serving for public and dist assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure data folder exists
const DATA_DIR = path.join(__dirname, 'data');
const SAVES_FILE = path.join(DATA_DIR, 'cloud_saves.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CloudSaveRecord {
  cloudId: string;
  playerName: string;
  level: number;
  totalTaps: number;
  coins: number;
  gems: number;
  prestigeCount: number;
  saveData: any;
  updatedAt: string;
}

function loadAllSaves(): Record<string, CloudSaveRecord> {
  try {
    if (fs.existsSync(SAVES_FILE)) {
      const raw = fs.readFileSync(SAVES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading saves file:', err);
  }
  return {};
}

function persistAllSaves(saves: Record<string, CloudSaveRecord>) {
  try {
    fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting saves file:', err);
  }
}

// Generate human-friendly 6-char Cloud ID (e.g., TAP-782A)
function generateCloudId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TAP-${code}`;
}

// Cloud Save API
app.post('/api/cloud/save', (req: Request, res: Response) => {
  try {
    const { cloudId, playerName, saveData } = req.body;

    if (!saveData || typeof saveData !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid save payload' });
    }

    const saves = loadAllSaves();
    const finalCloudId = (cloudId && typeof cloudId === 'string' && cloudId.trim().length >= 3)
      ? cloudId.trim().toUpperCase()
      : generateCloudId();

    const record: CloudSaveRecord = {
      cloudId: finalCloudId,
      playerName: playerName || saveData.playerName || 'Игрок',
      level: Number(saveData.level) || 1,
      totalTaps: Number(saveData.totalTaps) || 0,
      coins: Number(saveData.coins) || 0,
      gems: Number(saveData.gems) || 0,
      prestigeCount: Number(saveData.prestigeCount) || 0,
      saveData: saveData,
      updatedAt: new Date().toISOString()
    };

    saves[finalCloudId] = record;
    persistAllSaves(saves);

    return res.json({
      success: true,
      cloudId: finalCloudId,
      updatedAt: record.updatedAt,
      message: 'Прогресс успешно сохранён в облаке!'
    });
  } catch (err: any) {
    console.error('Cloud save error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// Cloud Load API
app.get('/api/cloud/load/:cloudId', (req: Request, res: Response) => {
  try {
    const cloudId = req.params.cloudId.trim().toUpperCase();
    const saves = loadAllSaves();

    const record = saves[cloudId];
    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Облачное сохранение с кодом "${cloudId}" не найдено!`
      });
    }

    return res.json({
      success: true,
      cloudId: record.cloudId,
      saveData: record.saveData,
      updatedAt: record.updatedAt
    });
  } catch (err: any) {
    console.error('Cloud load error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// Cloud Leaderboard API
app.get('/api/cloud/leaderboard', (_req: Request, res: Response) => {
  try {
    const saves = loadAllSaves();
    const records = Object.values(saves);

    // Sort by level desc, then totalTaps desc
    records.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      if (b.prestigeCount !== a.prestigeCount) return b.prestigeCount - a.prestigeCount;
      return b.totalTaps - a.totalTaps;
    });

    const top = records.slice(0, 30).map((r, idx) => ({
      rank: idx + 1,
      cloudId: r.cloudId,
      playerName: r.playerName,
      level: r.level,
      totalTaps: r.totalTaps,
      coins: r.coins,
      gems: r.gems,
      prestigeCount: r.prestigeCount,
      updatedAt: r.updatedAt
    }));

    return res.json({ success: true, leaderboard: top });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Real Players Pool for PvP Deals
app.get('/api/duel/real-players', (_req: Request, res: Response) => {
  try {
    const saves = loadAllSaves();
    const records = Object.values(saves);

    // Initial real registered player seeds if cloud is empty
    if (records.length === 0) {
      const realSeeds: Record<string, CloudSaveRecord> = {
        'TAP-DUB1': {
          cloudId: 'TAP-DUB1',
          playerName: 'Шейх Капибар 🇦🇪',
          level: 42,
          totalTaps: 48000,
          coins: 18500000,
          gems: 320,
          prestigeCount: 1,
          updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          saveData: {
            selectedSkinId: 'skin_sheikh_capy',
            selectedHatId: 'hat_crown',
            perks: { perk_gold_scepter: 3, perk_sheikh_blessing: 2 },
            tier: 'mortal'
          }
        },
        'TAP-SAM8': {
          cloudId: 'TAP-SAM8',
          playerName: 'Капи-Рёнин 2077 🥷',
          level: 89,
          totalTaps: 125000,
          coins: 98000000,
          gems: 850,
          prestigeCount: 3,
          updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          saveData: {
            selectedSkinId: 'skin_samurai_capy',
            selectedHatId: 'hat_shades',
            perks: { perk_katana_shadow: 4, perk_shadow_dance: 3 },
            tier: 'mortal'
          }
        },
        'TAP-TIT9': {
          cloudId: 'TAP-TIT9',
          playerName: 'Титан Колосс 💪',
          level: 168,
          totalTaps: 410000,
          coins: 1200000000,
          gems: 2400,
          prestigeCount: 5,
          updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          saveData: {
            selectedSkinId: 'skin_muscle_mutant',
            selectedHatId: 'hat_demon_horns',
            perks: { perk_colossal_sword: 5, perk_muscle_mutation: 1 },
            tier: 'divine'
          }
        },
        'TAP-ARC3': {
          cloudId: 'TAP-ARC3',
          playerName: 'Архимаг Эфира 🔮',
          level: 210,
          totalTaps: 890000,
          coins: 4500000000,
          gems: 5100,
          prestigeCount: 8,
          updatedAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
          saveData: {
            selectedSkinId: 'skin_toxic_ooze',
            selectedHatId: 'hat_archmage_hood',
            perks: { perk_crystal_orb: 5, perk_slime_mutation: 1 },
            tier: 'divine'
          }
        },
        'TAP-IMM1': {
          cloudId: 'TAP-IMM1',
          playerName: 'Бессмертный Абсолют 🌌',
          level: 295,
          totalTaps: 2300000,
          coins: 58000000000,
          gems: 18000,
          prestigeCount: 15,
          updatedAt: new Date(Date.now() - 1000 * 30).toISOString(),
          saveData: {
            selectedSkinId: 'skin_god_capy',
            selectedHatId: 'hat_cosmic_crown',
            perks: { perk_abyss_scythe: 5, perk_skeleton_frame: 1 },
            tier: 'immortal',
            immortalUnlocked: true
          }
        }
      };
      persistAllSaves(realSeeds);
      for (const k in realSeeds) {
        records.push(realSeeds[k]);
      }
    }

    const realOpponents = records.map((r) => {
      const sData = r.saveData || {};
      const perks = sData.perks || {};
      
      let weapon: string | undefined = undefined;
      if (perks['perk_colossal_sword']) weapon = 'greatsword';
      else if (perks['perk_katana_shadow']) weapon = 'katana';
      else if (perks['perk_gold_scepter']) weapon = 'scepter';
      else if (perks['perk_crystal_orb']) weapon = 'crystal_orb';
      else if (perks['perk_abyss_scythe']) weapon = 'scythe';

      let body: 'normal' | 'muscle' | 'slime' | 'skeleton' | 'divine' | 'immortal' = 'normal';
      if (r.level > 265 || sData.immortalUnlocked) body = 'immortal';
      else if (r.level > 165) body = 'divine';
      else if (perks['perk_muscle_mutation']) body = 'muscle';
      else if (perks['perk_slime_mutation']) body = 'slime';
      else if (perks['perk_skeleton_frame']) body = 'skeleton';

      const tier = r.level > 265 ? 'immortal' : (r.level > 165 ? 'divine' : 'mortal');
      const isOnline = (Date.now() - new Date(r.updatedAt).getTime()) < 1000 * 60 * 15;

      return {
        id: r.cloudId,
        nickname: r.playerName,
        level: r.level,
        coins: Math.max(15000, r.coins),
        avatarIcon: body === 'immortal' ? '🌌' : (body === 'divine' ? '👑' : '🦫'),
        auraEffect: body === 'immortal' ? 'immortal_void' : (body === 'divine' ? 'divine_light' : 'deal_fire'),
        tapPower: Math.max(80, Math.round(r.level * 22)),
        dealRank: r.level > 265 ? '🌌 Бессмертный Владыка' : (r.level > 165 ? '✨ Божественный Серафим' : (r.level > 80 ? '👑 Крипто-Владыка' : '💼 Акула Сделок')),
        equippedSkinId: sData.selectedSkinId || 'skin_default',
        equippedHatId: sData.selectedHatId || 'hat_none',
        equippedWeaponId: weapon,
        bodyMutation: body,
        isOnline: isOnline,
        tier: tier
      };
    });

    return res.json({ success: true, opponents: realOpponents });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(distPath);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
