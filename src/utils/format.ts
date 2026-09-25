const SUFFIXES = [
  '',
  'K',
  'M',
  'B',
  'T',
  'Qa',
  'Qi',
  'Sx',
  'Sp',
  'Oc',
  'No',
  'Dc',
  'Ud',
  'Dd',
  'Td',
  'Qad',
  'Qid',
  'Sxd',
  'Spd',
  'Ocd',
  'Nod',
  'Vg',
  'Cen',
  'Inf'
];

export function formatNumber(num: number): string {
  if (isNaN(num) || !isFinite(num)) return '0';
  if (num < 0) return '-' + formatNumber(-num);
  if (num < 1000) {
    return Math.floor(num).toLocaleString('ru-RU');
  }

  const exp = Math.floor(Math.log10(num) / 3);
  if (exp >= SUFFIXES.length) {
    return num.toExponential(2);
  }

  const shortValue = num / Math.pow(10, exp * 3);
  const formatted = shortValue >= 100 
    ? shortValue.toFixed(0) 
    : shortValue >= 10 
      ? shortValue.toFixed(1) 
      : shortValue.toFixed(2);

  return `${formatted} ${SUFFIXES[exp]}`;
}

export function formatTimeSeconds(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDurationHuman(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} сек`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hours} ч ${remMin} мин`;
}
