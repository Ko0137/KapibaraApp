import React, { useState, useEffect } from 'react';
import { GameSaveData } from '../types/game';
import { saveGameToCloud, loadGameFromCloud, fetchLeaderboard, exportSaveString, importSaveString } from '../services/cloudSave';
import { formatNumber } from '../utils/format';

interface CloudSaveModalProps {
  currentSaveData: GameSaveData;
  onRestoreSave: (data: GameSaveData) => void;
  onClose: () => void;
}

export const CloudSaveModal: React.FC<CloudSaveModalProps> = ({
  currentSaveData,
  onRestoreSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'leaderboard' | 'backup'>('cloud');
  const [inputCloudId, setInputCloudId] = useState('');
  const [cloudIdDisplay, setCloudIdDisplay] = useState(currentSaveData.cloudId || '');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [exportStr, setExportStr] = useState('');
  const [importInput, setImportInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      setIsLoading(true);
      fetchLeaderboard().then(res => {
        setIsLoading(false);
        if (res.success) {
          setLeaderboard(res.leaderboard);
        }
      });
    } else if (activeTab === 'backup') {
      setExportStr(exportSaveString(currentSaveData));
    }
  }, [activeTab, currentSaveData]);

  // Handle Cloud Save
  const handleSave = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const result = await saveGameToCloud(currentSaveData, cloudIdDisplay);
    setIsLoading(false);

    if (result.success) {
      setCloudIdDisplay(result.cloudId);
      setStatusMessage({ text: `Успешно сохранено в облако! Ваш Cloud ID: ${result.cloudId}` });
    } else {
      setStatusMessage({ text: result.message || 'Ошибка сохранения', isError: true });
    }
  };

  // Handle Cloud Load
  const handleLoad = async () => {
    if (!inputCloudId.trim()) {
      setStatusMessage({ text: 'Введите код облачного сохранения!', isError: true });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    const result = await loadGameFromCloud(inputCloudId.trim());
    setIsLoading(false);

    if (result.success && result.saveData) {
      onRestoreSave(result.saveData);
      setStatusMessage({ text: 'Прогресс успешно загружен из облака!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMessage({ text: result.error || 'Сохранение не найдено', isError: true });
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualImport = () => {
    if (!importInput.trim()) return;
    const parsed = importSaveString(importInput);
    if (parsed) {
      onRestoreSave(parsed);
      setStatusMessage({ text: 'Сохранение успешно импортировано!' });
      setTimeout(() => onClose(), 1000);
    } else {
      setStatusMessage({ text: 'Неверный формат строки сохранения!', isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☁️</span>
            <div>
              <h2 className="text-lg font-black text-white">Облачное Хранилище</h2>
              <span className="text-[11px] text-slate-400">Синхронизация между устройствами и Android</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 mt-3 mb-4 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cloud'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ☁️ Облако
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏆 Топ игроков
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'backup'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Файл
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-3 p-2.5 rounded-xl text-xs font-medium ${
              statusMessage.isError
                ? 'bg-red-950/80 border border-red-500 text-red-200'
                : 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* Cloud ID Display */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Ваш персональный Cloud ID:</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                    {cloudIdDisplay || 'Ещё не создан (нажмите сохранить)'}
                  </span>
                  {cloudIdDisplay && (
                    <button
                      onClick={() => copyToClipboard(cloudIdDisplay)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg transition-all"
                    >
                      {copied ? '✓ Скопировано' : 'Копировать'}
                    </button>
                  )}
                </div>
              </div>

              {/* Save to Cloud Button */}
              <button
                disabled={isLoading}
                onClick={handleSave}
                className="w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 active:scale-95 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>{isLoading ? 'Сохранение...' : 'Сохранить прогресс в облако'}</span>
              </button>

              <div className="border-t border-slate-800 pt-3">
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Восстановить игру с другого телефона или браузера:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Например: TAP-782A"
                    value={inputCloudId}
                    onChange={e => setInputCloudId(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    disabled={isLoading || !inputCloudId.trim()}
                    onClick={handleLoad}
                    className={`py-2 px-4 rounded-xl font-bold text-xs uppercase ${
                      inputCloudId.trim() && !isLoading
                        ? 'bg-emerald-500 text-slate-950 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Загрузить
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                💡 Облачное сохранение позволяет продолжить играть с любого телефона, планшета или компьютера. Просто введите свой Cloud ID.
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 mb-1">
                Глобальный рейтинг лучших тапателей мира:
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Загрузка рейтинга...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                  Сохраните игру в облако, чтобы занять первое место!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.map((item, idx) => (
                    <div
                      key={item.cloudId || idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        idx === 0
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : idx === 1
                            ? 'bg-slate-800/80 border-slate-600'
                            : idx === 2
                              ? 'bg-amber-900/15 border-amber-800/40'
                              : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold w-5 text-center text-slate-400">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${item.rank}`}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200">{item.playerName || 'Игрок'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.cloudId}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold font-mono text-amber-400">
                          Ур. {item.level} / 165
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatNumber(item.totalTaps)} тапов
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Экспорт локального сохранения (скопируйте этот код):
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={exportStr}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] font-mono text-slate-300 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(exportStr)}
                    className="absolute top-2 right-2 px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold"
                  >
                    {copied ? '✓ Скопировано' : 'Копировать'}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <label className="text-xs text-slate-400 block mb-1">
                  Импорт сохраненного кода:
                </label>
                <textarea
                  placeholder="Вставьте скопированный код сохранения..."
                  value={importInput}
                  onChange={e => setImportInput(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  disabled={!importInput.trim()}
                  onClick={handleManualImport}
                  className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs rounded-xl"
                >
                  Импортировать прогресс
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
