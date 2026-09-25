import React, { useState, useEffect } from 'react';
import { Trophy, ShieldCheck, Flame, RefreshCw, Star, User, AlertCircle, Sparkles } from 'lucide-react';
import { LeaderboardItem } from '../types/game';
import { fetchLeaderboard, submitLeaderboardScore } from '../services/leaderboard';
import { formatNumber } from '../utils/format';
import { hapticEffects } from '../utils/haptics';

interface LeaderboardModalProps {
  onClose: () => void;
  playerStats: {
    nickname: string;
    level: number;
    prestige: number;
    totalCoinsEarned: number;
    bossesDefeated: number;
  };
  onUpdateNickname: (name: string) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  onClose,
  playerStats,
  onUpdateNickname,
}) => {
  const [activeTab, setActiveTab] = useState<'coins' | 'prestige'>('coins');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [editNick, setEditNick] = useState<string>(playerStats.nickname);

  const loadScores = async (category: 'coins' | 'prestige') => {
    setLoading(true);
    const data = await fetchLeaderboard(category);
    setLeaderboard(data);
    setLoading(false);
  };

  useEffect(() => {
    loadScores(activeTab);
  }, [activeTab]);

  const handleSyncScore = async () => {
    setSyncing(true);
    setSyncMessage(null);
    hapticEffects.purchase();

    const res = await submitLeaderboardScore({
      nickname: editNick,
      level: playerStats.level,
      prestige: playerStats.prestige,
      totalCoinsEarned: playerStats.totalCoinsEarned,
      bossesDefeated: playerStats.bossesDefeated,
    });

    if (res.success) {
      setSyncMessage('✅ Счёт синхронизирован с Firebase!');
      onUpdateNickname(editNick);
      await loadScores(activeTab);
    } else {
      setSyncMessage(`❌ ${res.error || 'Ошибка отправки'}`);
    }
    setSyncing(false);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-xl">🥇</span>;
    if (index === 1) return <span className="text-xl">🥈</span>;
    if (index === 2) return <span className="text-xl">🥉</span>;
    return <span className="font-mono text-zinc-400 font-bold text-sm">#{index + 1}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-amber-500/40 w-full max-w-lg rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Глобальный Лидерборд
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-extrabold px-1.5 py-0.5 rounded-full">
                  FIREBASE
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Топ сильнейших таперов мира</p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Sync & Nickname bar */}
        <div className="my-3 p-3 bg-zinc-800/80 rounded-2xl border border-zinc-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                type="text"
                value={editNick}
                onChange={(e) => setEditNick(e.target.value)}
                placeholder="Ваш позывной в таблице"
                maxLength={20}
                className="bg-zinc-900 border border-zinc-700 text-white text-xs px-2.5 py-1.5 rounded-xl flex-1 focus:outline-none focus:border-amber-400 min-w-0"
              />
            </div>
            <button
              onClick={handleSyncScore}
              disabled={syncing}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Отправка...' : 'Синхронизировать'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Cheat Guard Активен</span>
            </div>
            <span>Ваш счёт: 🪙 {formatNumber(playerStats.totalCoinsEarned)}</span>
          </div>

          {syncMessage && (
            <p className="mt-2 text-xs font-semibold text-center text-amber-300 bg-amber-950/40 py-1 rounded-lg border border-amber-800/50">
              {syncMessage}
            </p>
          )}
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveTab('coins');
            }}
            className={`py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'coins'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            По Заработку Монет
          </button>
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveTab('prestige');
            }}
            className={`py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'prestige'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-yellow-300" />
            По Престижу & Уровню
          </button>
        </div>

        {/* Leaderboard Table List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs">Загрузка данных из облака Firebase...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Лидерборд пока пуст. Будь первым, кто синхронизирует свой рекорд!
            </div>
          ) : (
            leaderboard.map((item, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={item.userId || idx}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/60 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-850/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 flex justify-center">{getRankBadge(idx)}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate max-w-[140px]">
                          {item.nickname}
                        </span>
                        {item.verifiedFair && (
                          <span title="Проверено защитой от накрутки">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span className="text-amber-300 font-semibold">Ур. {item.level}</span>
                        {item.prestige > 0 && (
                          <span className="text-purple-300 font-semibold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-purple-400 text-purple-400" />
                            {item.prestige} престиж
                          </span>
                        )}
                        <span>⚔️ {item.bossesDefeated || 0} боссов</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-xs text-amber-300 font-mono">
                      🪙 {formatNumber(item.totalCoinsEarned)}
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Сегодня'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-400" /> Обновление в реальном времени
          </span>
          <button
            onClick={() => loadScores(activeTab)}
            className="hover:text-amber-400 flex items-center gap-1 underline"
          >
            Обновить список
          </button>
        </div>

      </div>
    </div>
  );
};
