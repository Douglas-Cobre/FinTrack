import { environment } from '../../../environments/environment';

export function apiUrl(path = ''): string {
  return `${environment.apiUrl.replace(/\/$/, '')}${path ? '/' + path.replace(/^\//, '') : ''}`;
}

export function pertenceAApi(url: string, origin: string): boolean {
  const base = new URL(apiUrl(), origin);
  const destino = new URL(url, origin);
  return destino.origin === base.origin
    && (destino.pathname === base.pathname || destino.pathname.startsWith(base.pathname + '/'));
}
