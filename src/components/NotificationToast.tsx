import React from 'react';
import { Sparkles, Award, Zap, Bell, CheckCircle2, X } from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'level' | 'achievement' | 'neuromuscular' | 'telegram';
  icon?: string;
  timestamp: number;
}

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-3 inset-x-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4 max-w-md mx-auto">
      {notifications.map((n) => {
        const bgStyles = {
          info: 'bg-zinc-900/95 border-amber-500/50 text-white shadow-amber-500/10',
          success: 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-500/10',
          level: 'bg-amber-950/95 border-amber-400 text-amber-200 shadow-amber-400/20',
          achievement: 'bg-purple-950/95 border-purple-400 text-purple-200 shadow-purple-400/20',
          neuromuscular: 'bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-500/20',
          telegram: 'bg-cyan-950/95 border-cyan-400 text-cyan-200 shadow-cyan-400/20',
        }[n.type] || 'bg-zinc-900/95 border-zinc-700 text-white';

        const defaultIcon = {
          info: <Bell className="w-5 h-5 text-amber-400 animate-pulse" />,
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />,
          level: <Award className="w-5 h-5 text-amber-400 animate-bounce" />,
          achievement: <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />,
          neuromuscular: <Zap className="w-5 h-5 text-rose-400 animate-pulse" />,
          telegram: <span className="text-xl">🔵</span>,
        }[n.type];

        return (
          <div
            key={n.id}
            className={`pointer-events-auto w-full p-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-slideDown ${bgStyles}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                {n.icon ? <span className="text-xl">{n.icon}</span> : defaultIcon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black truncate">{n.title}</h4>
                <p className="text-[11px] opacity-90 leading-tight break-words">{n.message}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(n.id)}
              className="p-1 rounded-lg bg-black/30 hover:bg-black/50 text-white/70 hover:text-white shrink-0 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
