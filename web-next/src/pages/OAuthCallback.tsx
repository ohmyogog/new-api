import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

const MAX_RETRIES = 3;

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      toast.error('未获取到授权码');
      navigate('/login', { replace: true });
      return;
    }

    sendCode(code, state);
  }, []);

  async function sendCode(code: string, state: string | null, retry = 0) {
    try {
      const res = await API.get(`/api/oauth/${provider}?code=${code}&state=${state ?? ''}`);
      const { success, message, data } = res.data;

      if (!success) {
        toast.error(message || '授权失败');
        navigate('/login', { replace: true });
        return;
      }

      if (message === 'bind') {
        toast.success('绑定成功');
        navigate('/console/personal', { replace: true });
      } else {
        localStorage.setItem('user', JSON.stringify(data));
        toast.success('登录成功');
        navigate('/console', { replace: true });
      }
    } catch (error: unknown) {
      if (retry < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, (retry + 1) * 2000));
        return sendCode(code, state, retry + 1);
      }
      const msg = error instanceof Error ? error.message : '授权失败';
      toast.error(msg);
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f5] flex flex-col items-center justify-center gap-4">
      <Loader2 className="size-8 text-primary animate-spin" />
      <p className="text-sm text-slate-500">正在处理授权...</p>
    </div>
  );
}
