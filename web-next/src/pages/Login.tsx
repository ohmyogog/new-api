import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Github, KeyRound, Mail, Eye, EyeOff, Loader2, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { API, updateAPI } from '@/api/client';

interface StatusData {
  github_oauth?: boolean;
  github_client_id?: string;
  discord_oauth?: boolean;
  discord_client_id?: string;
  oidc_enabled?: boolean;
  oidc_authorization_endpoint?: string;
  oidc_client_id?: string;
  wechat_login?: boolean;
  wechat_qrcode?: string;
  linuxdo_oauth?: boolean;
  linuxdo_client_id?: string;
  telegram_oauth?: boolean;
  telegram_bot_name?: string;
  passkey_login?: boolean;
  turnstile_check?: boolean;
  turnstile_site_key?: string;
  self_use_mode_enabled?: boolean;
  user_agreement_enabled?: boolean;
  privacy_policy_enabled?: boolean;
  custom_oauth_providers?: Array<{ slug: string; name: string; icon?: string }>;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  /* ── status from backend ── */
  const status: StatusData = useMemo(() => {
    const saved = localStorage.getItem('status');
    if (!saved) return {};
    try { return JSON.parse(saved) ?? {}; } catch { return {}; }
  }, []);

  const hasUserAgreement = status.user_agreement_enabled ?? false;
  const hasPrivacyPolicy = status.privacy_policy_enabled ?? false;
  const needsAgreement = hasUserAgreement || hasPrivacyPolicy;

  const hasCustomOAuth = (status.custom_oauth_providers ?? []).length > 0;
  const hasOAuth = Boolean(
    status.github_oauth || status.discord_oauth || status.oidc_enabled ||
    status.wechat_login || status.linuxdo_oauth || status.telegram_oauth || hasCustomOAuth
  );

  useEffect(() => {
    if (searchParams.get('expired')) {
      alert('未登录或登录已过期，请重新登录');
    }
  }, [searchParams]);

  /* ── OAuth redirect helpers ── */
  const oauthRedirect = useCallback((url: string) => {
    if (needsAgreement && !agreedToTerms) {
      alert('请先阅读并同意用户协议和隐私政策');
      return;
    }
    window.location.href = url;
  }, [needsAgreement, agreedToTerms]);

  const handleGitHub = () => {
    oauthRedirect(`https://github.com/login/oauth/authorize?client_id=${status.github_client_id}&scope=user:email`);
  };
  const handleDiscord = () => {
    oauthRedirect(`https://discord.com/api/oauth2/authorize?client_id=${status.discord_client_id}&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/discord')}&response_type=code&scope=identify+email`);
  };
  const handleOIDC = () => {
    if (!status.oidc_authorization_endpoint || !status.oidc_client_id) return;
    oauthRedirect(`${status.oidc_authorization_endpoint}?client_id=${status.oidc_client_id}&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/oidc')}&response_type=code&scope=openid+profile+email`);
  };
  const handleLinuxDO = () => {
    oauthRedirect(`https://connect.linux.do/oauth2/authorize?client_id=${status.linuxdo_client_id}&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/linuxdo')}`);
  };
  const handleCustomOAuth = (provider: { slug: string; name: string }) => {
    oauthRedirect(`${window.location.origin}/api/oauth/${provider.slug}/redirect`);
  };

  /* ── Login submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsAgreement && !agreedToTerms) {
      alert('请先阅读并同意用户协议和隐私政策');
      return;
    }
    if (!username || !password) { alert('请输入用户名和密码'); return; }
    setLoading(true);
    try {
      const res = await API.post('/api/user/login', { username, password });
      const { success, message, data } = res.data;
      if (success) {
        if (data?.require_2fa) { setShow2FA(true); setLoading(false); return; }
        localStorage.setItem('user', JSON.stringify(data));
        updateAPI();
        navigate('/console');
      } else {
        alert(message);
      }
    } catch { alert('登录失败，请重试'); }
    finally { setLoading(false); }
  };

  /* ── 2FA submit ── */
  const handle2FA = async () => {
    if (!twoFACode) return;
    setTwoFALoading(true);
    try {
      const res = await API.post('/api/user/2fa/verify', { code: twoFACode, username, password });
      const { success, message, data } = res.data;
      if (success) {
        localStorage.setItem('user', JSON.stringify(data));
        updateAPI();
        navigate('/console');
      } else { alert(message); }
    } catch { alert('验证失败，请重试'); }
    finally { setTwoFALoading(false); }
  };

  /* ── OAuth button component ── */
  const OAuthBtn = ({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 border-2 border-slate-200 hover:border-primary/30 hover:bg-primary/5 rounded-2xl px-5 py-3 text-sm font-medium text-slate-700 transition-all"
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  /* ── 2FA Modal ── */
  if (show2FA) {
    return (
      <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Ogog AI</span>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="size-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">两步验证</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">请输入您的验证器应用中的 6 位验证码</p>
            <Input
              placeholder="000000"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-[0.5em] font-mono mb-4"
            />
            <Button
              onClick={handle2FA}
              disabled={twoFALoading || twoFACode.length < 6}
              className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-primary/15"
            >
              {twoFALoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              验证
            </Button>
            <button
              type="button"
              onClick={() => { setShow2FA(false); setTwoFACode(''); }}
              className="w-full mt-3 text-sm text-slate-500 hover:text-primary transition-colors"
            >
              返回登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN RENDER ── */
  return (
    <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
            <Zap className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">Ogog AI</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
          <h1 className="text-xl font-bold text-slate-800 text-center mb-8">登录</h1>

          {/* ── OAuth view ── */}
          {!showForm && hasOAuth ? (
            <div className="space-y-3">
              {status.github_oauth && (
                <OAuthBtn icon={<Github className="size-5" />} onClick={handleGitHub}>使用 GitHub 继续</OAuthBtn>
              )}
              {status.discord_oauth && (
                <OAuthBtn icon={<MessageCircle className="size-5 text-[#5865F2]" />} onClick={handleDiscord}>使用 Discord 继续</OAuthBtn>
              )}
              {status.oidc_enabled && (
                <OAuthBtn icon={<ExternalLink className="size-5 text-blue-500" />} onClick={handleOIDC}>使用 OIDC 继续</OAuthBtn>
              )}
              {status.linuxdo_oauth && (
                <OAuthBtn icon={<ExternalLink className="size-5 text-orange-500" />} onClick={handleLinuxDO}>使用 LinuxDO 继续</OAuthBtn>
              )}
              {status.passkey_login && (
                <OAuthBtn icon={<KeyRound className="size-5 text-emerald-500" />} onClick={() => {}}>使用 Passkey 登录</OAuthBtn>
              )}
              {(status.custom_oauth_providers ?? []).map((p) => (
                <OAuthBtn key={p.slug} icon={<ExternalLink className="size-5" />} onClick={() => handleCustomOAuth(p)}>
                  使用 {p.name} 继续
                </OAuthBtn>
              ))}

              {/* Agreement checkbox */}
              {needsAgreement && (
                <AgreementCheckbox checked={agreedToTerms} onChange={setAgreedToTerms} hasUA={hasUserAgreement} hasPP={hasPrivacyPolicy} />
              )}

              <div className="flex items-center gap-3 my-4">
                <Separator className="flex-1" />
                <span className="text-xs text-slate-400">或</span>
                <Separator className="flex-1" />
              </div>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-primary/15 flex items-center justify-center gap-2 transition-all"
              >
                <Mail className="size-4" />
                使用邮箱或用户名登录
              </button>
            </div>
          ) : (
            /* ── Email/password form ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">用户名或邮箱</label>
                <Input
                  placeholder="请输入用户名或邮箱"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">密码</label>
                <div className="relative">
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {needsAgreement && (
                <AgreementCheckbox checked={agreedToTerms} onChange={setAgreedToTerms} hasUA={hasUserAgreement} hasPP={hasPrivacyPolicy} />
              )}

              <Button
                type="submit"
                disabled={loading || (needsAgreement && !agreedToTerms)}
                className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-primary/15"
              >
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                登录
              </Button>

              <div className="text-center">
                <Link to="/reset" className="text-sm text-slate-500 hover:text-primary transition-colors">
                  忘记密码？
                </Link>
              </div>

              {hasOAuth && (
                <>
                  <div className="flex items-center gap-3 my-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-slate-400">或</span>
                    <Separator className="flex-1" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full border-2 border-primary/20 text-primary hover:bg-primary/5 px-8 py-3 rounded-2xl font-bold transition-all"
                  >
                    其他登录选项
                  </button>
                </>
              )}
            </form>
          )}

          {/* Register link */}
          {!status.self_use_mode_enabled && (
            <p className="text-center text-sm text-slate-500 mt-6">
              没有账户？{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                注册
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared agreement checkbox ── */
function AgreementCheckbox({ checked, onChange, hasUA, hasPP }: {
  checked: boolean; onChange: (v: boolean) => void; hasUA: boolean; hasPP: boolean;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer mt-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
      />
      <span className="text-xs text-slate-500 leading-relaxed">
        我已阅读并同意
        {hasUA && <a href="/user-agreement" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mx-0.5">用户协议</a>}
        {hasUA && hasPP && '和'}
        {hasPP && <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mx-0.5">隐私政策</a>}
      </span>
    </label>
  );
}
