import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Zap, KeyRound, Loader2, Eye, EyeOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

export default function PasswordResetConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';
  const isValidLink = Boolean(email && token);

  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (!isValidLink) {
      toast.error('无效的重置链接，请重新发起密码重置请求');
    }
  }, [isValidLink]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidLink) {
      toast.error('无效的重置链接');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/api/user/reset', { email, token });
      const { success, message, data } = res.data;
      if (success) {
        setNewPassword(data);
        try {
          await navigator.clipboard.writeText(data);
          toast.success('密码已重置并已复制到剪贴板');
        } catch {
          toast.success('密码已重置，请手动复制');
        }
      } else {
        toast.error(message);
      }
    } catch {
      toast.error('请求失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="size-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <Zap className="size-7 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">Ogog AI</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow px-10 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="size-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">密码重置确认</h1>
          </div>

          {!isValidLink && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-600">
              无效的重置链接，请重新发起密码重置请求
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">邮箱</label>
              <Input
                type="email"
                value={email}
                disabled
                className="h-12 rounded-xl bg-slate-50"
              />
            </div>

            {newPassword && (
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">新密码</label>
                <div className="relative">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    readOnly
                    className="pr-20 h-12 rounded-xl bg-slate-50 font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="p-1.5 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(newPassword);
                          toast.success('已复制到剪贴板');
                        } catch {
                          toast.error('复制失败');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-primary"
                      tabIndex={-1}
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !isValidLink || Boolean(newPassword)}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-full font-bold shadow-xl shadow-primary/15 text-base"
            >
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              {newPassword ? '密码重置完成' : '确认重置密码'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            <Link to="/login" className="text-primary font-semibold hover:underline">
              返回登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
