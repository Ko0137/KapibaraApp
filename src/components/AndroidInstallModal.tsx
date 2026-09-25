import React from 'react';

interface AndroidInstallModalProps {
  installPrompt: any; // BeforeInstallPromptEvent
  onTriggerInstall: () => void;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  installPrompt,
  onTriggerInstall,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="text-lg font-black text-white">Установка на Android</h2>
              <span className="text-[11px] text-slate-400">Игра как APK-приложение на экране телефона</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-xs">
          {/* Quick Install Button if supported */}
          {installPrompt ? (
            <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 rounded-2xl text-center space-y-2">
              <span className="text-3xl block">🚀</span>
              <h3 className="text-sm font-black text-emerald-300">Ваше устройство готово к установке!</h3>
              <p className="text-slate-300">
                Нажмите кнопку ниже, чтобы установить MegaTap на свой рабочий стол в 1 клик.
              </p>
              <button
                onClick={() => {
                  onTriggerInstall();
                  onClose();
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm rounded-xl uppercase tracking-wider shadow-lg shadow-emerald-500/30"
              >
                📲 Установить на телефон
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span>🤖</span>
                <span>Быстрая установка через Google Chrome (Android):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                <li>Откройте эту страницу в браузере <strong>Chrome</strong> на Android</li>
                <li>Нажмите на <strong>три точки (⋮)</strong> в верхнем правом углу браузера</li>
                <li>Нажмите <strong>«Установить приложение»</strong> (или «Добавить на главный экран»)</li>
                <li>Готово! Игра появится на рабочем столе как полноценное APK-приложение без адресной строки и будет работать офлайн!</li>
              </ol>
            </div>
          )}

          {/* Standalone APK section */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <span>📦</span>
              <span>Как сгенерировать самостоятельный .APK файл:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Игра полностью соответствует стандартам <strong>PWA (Progressive Web App)</strong> с манифестом, иконками и оффлайн-кэшем. Чтобы скомпилировать из неё независимый установочный файл <strong>.apk</strong>:
            </p>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div>1. Скопируйте URL игры</div>
              <div>2. Откройте бесплатный сервис <strong>PWABuilder.com</strong> или используйте <strong>Bubblewrap CLI</strong></div>
              <div>3. Нажмите <strong>«Generate APK»</strong> и скачайте готовый подписанный APK для отправки друзьям!</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Манифест приложения:</span>
            <a
              href="/manifest.webmanifest"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline font-mono text-[11px]"
            >
              manifest.webmanifest ↗
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
        >
          Понятно, продолжить играть!
        </button>
      </div>
    </div>
  );
};
