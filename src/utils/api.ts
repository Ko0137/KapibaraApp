/**
 * Resolves the correct backend URL for API calls.
 * If running on a local development server or inside Google Cloud (e.g. .run.app), it uses relative paths.
 * Otherwise (e.g., Vercel, Netlify, custom domain, Telegram client frame), it routes back to the public Google Cloud server.
 */
export function getApiUrl(path: string): string {
  const currentHost = window.location.hostname;
  
  // If we are on Vercel or any other external domain, route to the persistent Google Cloud AI Studio backend
  const isExternal = 
    !currentHost.includes('localhost') && 
    !currentHost.includes('127.0.0.1') && 
    !currentHost.includes('.run.app') && 
    !currentHost.includes('.aistudio.google');

  if (isExternal) {
    // ALWAYS use the public Shared App URL (-pre-) for external requests to bypass Google Dev Authentication login!
    const backendBase = 'https://ais-pre-sq7tljk3kyurdskrzjikqh-951533629059.asia-southeast1.run.app';
    return `${backendBase}${path.startsWith('/') ? path : '/' + path}`;
  }
  
  return path;
}

/**
 * Safely parses a fetch Response as JSON.
 * If the response is not valid JSON (e.g. is HTML from a login page or error),
 * it returns a structured error payload instead of crashing the app.
 */
export async function safeJsonParse<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    let errMsg = `Ошибка сервера (${res.status})`;
    try {
      if (contentType && contentType.includes('application/json')) {
        const errJson = await res.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } else {
        const text = await res.text();
        if (text.includes('<!DOCTYPE') || text.includes('<!doctype') || text.includes('<html')) {
          errMsg = `Ошибка сервера (${res.status}): Неверный формат ответа (HTML). Возможно, требуется авторизация или ссылка устарела.`;
        } else {
          errMsg = text.slice(0, 100) || errMsg;
        }
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    if (text.includes('<!DOCTYPE') || text.includes('<!doctype') || text.includes('<html')) {
      throw new Error('Получен некорректный ответ от сервера (HTML-страница вместо JSON). Возможно, бэкенд недоступен.');
    }
    throw new Error('Ответ сервера не является корректным JSON.');
  }

  return res.json() as Promise<T>;
}
