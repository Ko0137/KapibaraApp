import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import { Sparkles, Gift } from 'lucide-react';

interface FlyingEventProps {
  onCollect: (bonusType: 'coins' | 'frenzy') => void;
}

export const FlyingEvent: React.FC<FlyingEventProps> = ({ onCollect }) => {
  const [visible, setVisible] = useState(false);
  const [eventType, setEventType] = useState<'coins' | 'frenzy'>('frenzy');

  useEffect(() => {
    // Schedule occasional surprise bonus every 45-80 seconds
    const scheduleNext = () => {
      const delay = (40 + Math.random() * 40) * 1000;
      return setTimeout(() => {
        const type = Math.random() > 0.4 ? 'frenzy' : 'coins';
        setEventType(type);
        setVisible(true);
      }, delay);
    };

    const timer = scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide after 16 seconds if not clicked
  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 16000);
    return () => clearTimeout(hideTimer);
  }, [visible]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playGoldenDumpling();
    setVisible(false);
    onCollect(eventType);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleClick}
      className="fixed top-20 right-3 z-50 cursor-pointer select-none touch-manipulation animate-bounce"
    >
      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black px-3 py-1.5 rounded-full shadow-2xl border-2 border-yellow-200 active:scale-95 transition-transform duration-100">
        <span className="text-xl shrink-0">
          {eventType === 'frenzy' ? '⚡' : '🥟'}
        </span>
        <div className="text-left pr-1 leading-tight">
          <span className="block font-black text-[11px] uppercase tracking-wider">
            {eventType === 'frenzy' ? 'x7 МЕГА-РАЖ!' : 'ЗОЛОТОЙ КУШ!'}
          </span>
          <span className="text-[9px] font-bold text-zinc-900">
            Нажми и забери! 🎁
          </span>
        </div>
      </div>
    </div>
  );
};
