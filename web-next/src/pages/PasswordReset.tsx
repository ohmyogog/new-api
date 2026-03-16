import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!disableButton) return;
    if (countdown <= 0) {
      setDisableButton(false);
      setCountdown(30);
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [disableButton, countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error('请输入邮箱地址');
      return;
    }
    setDisableButton(true);
    setLoading(true);
    try {
      const res = await API.get(`/api/reset_password?email=${encodeURIComponent(email)}`);
      const { success, message } = res.data;
      if (success) {
        toast.success('重置邮件发送成功，请检查邮箱');
        setEmail('');
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
              <Mail className="size-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">密码重置</h1>
          </div>
          <p className="text-sm text-slate-500 mb-6">输入您的邮箱地址，我们将发送密码重置链接</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">邮箱</label>
              <Input
                type="email"
                placeholder="请输入您的邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-12 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || disableButton}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-full font-bold shadow-xl shadow-primary/15 text-base"
            >
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              {disableButton ? `重试 (${countdown})` : '发送重置邮件'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            想起来了？{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              返回登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
