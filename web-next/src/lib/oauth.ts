import { API } from '@/api/client';
import { toAbsoluteAppUrl, withBasePath } from '@/lib/routes';

export interface CustomOAuthProvider {
  slug: string;
  name: string;
  icon?: string;
  client_id?: string;
  authorization_endpoint?: string;
  scopes?: string;
}

export async function getOAuthState(redirectPath: string): Promise<string> {
  const params = new URLSearchParams();
  params.set('redirect_path', withBasePath(redirectPath));

  const aff = localStorage.getItem('aff');
  if (aff) {
    params.set('aff', aff);
  }

  const res = await API.get(`/api/oauth/state?${params.toString()}`);
  const { success, message, data } = res.data;
  if (!success || !data) {
    throw new Error(message || '获取 OAuth 状态失败');
  }

  return data;
}

export function getOAuthCallbackUrl(path: string): string {
  return toAbsoluteAppUrl(path);
}
