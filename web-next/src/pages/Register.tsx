import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Github, Mail, Eye, EyeOff, Loader2, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { API } from '@/api/client';
import { getOAuthCallbackUrl, getOAuthState, type CustomOAuthProvider } from '@/lib/oauth';
import { withBasePath } from '@/lib/routes';
import toast from 'react-hot-toast';

interface StatusData {
  github_oauth?: boolean;
  github_client_id?: string;
  discord_oauth?: boolean;
  discord_client_id?: string;
  oidc_enabled?: boolean;
  oidc_authorization_endpoint?: string;
  oidc_client_id?: string;
  wechat_login?: boolean;
  linuxdo_oauth?: boolean;
  linuxdo_client_id?: string;
  telegram_oauth?: boolean;
  telegram_bot_name?: string;
  turnstile_check?: boolean;
  turnstile_site_key?: string;
  email_verification?: boolean;
  user_agreement_enabled?: boolean;
  privacy_policy_enabled?: boolean;
  custom_oauth_providers?: CustomOAuthProvider[];
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const status: StatusData = useMemo(() => {
    const saved = localStorage.getItem('status');
    if (!saved) return {};
    try { return JSON.parse(saved) ?? {}; } catch { return {}; }
  }, []);

  const hasUserAgreement = status.user_agreement_enabled ?? false;
  const hasPrivacyPolicy = status.privacy_policy_enabled ?? false;
  const needsAgreement = hasUserAgreement || hasPrivacyPolicy;
  const showEmailVerification = status.email_verification ?? false;

  const hasCustomOAuth = (status.custom_oauth_providers ?? []).length > 0;
  const hasOAuth = Boolean(
    status.github_oauth || status.discord_oauth || status.oidc_enabled ||
    status.wechat_login || status.linuxdo_oauth || status.telegram_oauth || hasCustomOAuth
  );

  // Save aff code
  useEffect(() => {
    const aff = new URLSearchParams(window.location.search).get('aff');
    if (aff) localStorage.setItem('aff', aff);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const oauthRedirect = useCallback((url: string) => {
    window.location.href = url;
  }, []);

  const handleGitHub = async () => {
    try {
      const state = await getOAuthState('/oauth/github');
      oauthRedirect(
        `https://github.com/login/oauth/authorize?client_id=${status.github_client_id}&state=${state}&scope=user:email&redirect_uri=${encodeURIComponent(getOAuthCallbackUrl('/oauth/github'))}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'GitHub 注册初始化失败');
    }
  };
  const handleDiscord = async () => {
    try {
      const state = await getOAuthState('/oauth/discord');
      oauthRedirect(
        `https://discord.com/api/oauth2/authorize?client_id=${status.discord_client_id}&redirect_uri=${encodeURIComponent(getOAuthCallbackUrl('/oauth/discord'))}&response_type=code&scope=identify+email&state=${state}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Discord 注册初始化失败');
    }
  };
  const handleOIDC = async () => {
    if (!status.oidc_authorization_endpoint || !status.oidc_client_id) return;
    try {
      const state = await getOAuthState('/oauth/oidc');
      oauthRedirect(
        `${status.oidc_authorization_endpoint}?client_id=${status.oidc_client_id}&redirect_uri=${encodeURIComponent(getOAuthCallbackUrl('/oauth/oidc'))}&response_type=code&scope=openid+profile+email&state=${state}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'OIDC 注册初始化失败');
    }
  };
  const handleLinuxDO = async () => {
    try {
      const state = await getOAuthState('/oauth/linuxdo');
      oauthRedirect(
        `https://connect.linux.do/oauth2/authorize?client_id=${status.linuxdo_client_id}&response_type=code&redirect_uri=${encodeURIComponent(getOAuthCallbackUrl('/oauth/linuxdo'))}&state=${state}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'LinuxDO 注册初始化失败');
    }
  };
  const handleCustomOAuth = async (p: CustomOAuthProvider) => {
    if (!p.authorization_endpoint || !p.client_id) {
      toast.error('OAuth 配置不完整');
      return;
    }
    try {
      const state = await getOAuthState(`/oauth/${p.slug}`);
      const authUrl = new URL(p.authorization_endpoint);
      authUrl.searchParams.set('client_id', p.client_id);
      authUrl.searchParams.set('redirect_uri', getOAuthCallbackUrl(`/oauth/${p.slug}`));
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', p.scopes || 'openid profile email');
      authUrl.searchParams.set('state', state);
      oauthRedirect(authUrl.toString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${p.name} 注册初始化失败`);
    }
  };

  const sendVerificationCode = async () => {
    if (!email) { toast.error('请输入邮箱地址'); return; }
    setCodeLoading(true);
    try {
      const res = await API.get(`/api/verification?email=${encodeURIComponent(email)}`);
      if (res.data.success) { setCountdown(30); } else { toast.error(res.data.message); }
    } catch { toast.error('发送验证码失败'); }
    finally { setCodeLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('密码长度不得小于 8 位'); return; }
    if (password !== password2) { toast.error('两次输入的密码不一致'); return; }
    if (!username || !password) { toast.error('请填写完整信息'); return; }
    if (needsAgreement && !agreedToTerms) { toast.error('请先阅读并同意用户协议和隐私政策'); return; }
    setLoading(true);
    try {
      const affCode = localStorage.getItem('aff') || '';
      const res = await API.post('/api/user/register', {
        username, password, password2, email,
        verification_code: verificationCode,
        aff_code: affCode,
      });
      if (res.data.success) { navigate('/login'); toast.success('注册成功！'); }
      else { toast.error(res.data.message); }
    } catch { toast.error('注册失败，请重试'); }
    finally { setLoading(false); }
  };

  const OAuthBtn = ({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) => (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-3 border-2 border-slate-200 hover:border-primary/30 hover:bg-primary/5 rounded-2xl px-5 py-3 text-sm font-medium text-slate-700 transition-all">
      {icon}<span>{children}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo - centered vertically */}
        <div className="flex flex-col items-center mb-10">
          <div className="size-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <Zap className="size-7 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">Ogog AI</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow px-10 py-8">
          <h1 className="text-xl font-bold text-slate-800 text-center mb-8">注册</h1>

          {/* OAuth view */}
          {!showForm && hasOAuth ? (
            <div className="space-y-3">
              {status.github_oauth && <OAuthBtn icon={<Github className="size-5" />} onClick={handleGitHub}>使用 GitHub 继续</OAuthBtn>}
              {status.discord_oauth && <OAuthBtn icon={<MessageCircle className="size-5 text-[#5865F2]" />} onClick={handleDiscord}>使用 Discord 继续</OAuthBtn>}
              {status.oidc_enabled && <OAuthBtn icon={<ExternalLink className="size-5 text-blue-500" />} onClick={handleOIDC}>使用 OIDC 继续</OAuthBtn>}
              {status.linuxdo_oauth && <OAuthBtn icon={<ExternalLink className="size-5 text-orange-500" />} onClick={handleLinuxDO}>使用 LinuxDO 继续</OAuthBtn>}
              {(status.custom_oauth_providers ?? []).map((p) => (
                <OAuthBtn key={p.slug} icon={<ExternalLink className="size-5" />} onClick={() => handleCustomOAuth(p)}>使用 {p.name} 继续</OAuthBtn>
              ))}

              <div className="flex items-center gap-3 my-4">
                <Separator className="flex-1" /><span className="text-xs text-slate-400">或</span><Separator className="flex-1" />
              </div>

              <button type="button" onClick={() => setShowForm(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-full font-bold shadow-xl shadow-primary/15 flex items-center justify-center gap-2 transition-all">
                <Mail className="size-4" />使用用户名注册
              </button>
            </div>
          ) : (
            /* Registration form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">用户名</label>
                <Input placeholder="请输入用户名" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="h-12 rounded-xl" />
              </div>

              {showEmailVerification && (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">邮箱</label>
                    <div className="flex gap-2">
                      <Input placeholder="输入邮箱地址" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 h-12 rounded-xl" />
                      <button type="button" onClick={sendVerificationCode} disabled={codeLoading || countdown > 0}
                        className="shrink-0 border-2 border-primary/20 text-primary hover:bg-primary/5 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                        {countdown > 0 ? `${countdown}s` : codeLoading ? '...' : '获取验证码'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">验证码</label>
                    <Input placeholder="输入验证码" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">密码</label>
                <div className="relative">
                  <Input type={showPwd ? 'text' : 'password'} placeholder="最短 8 位" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="pr-12 h-12 rounded-xl" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">确认密码</label>
                <div className="relative">
                  <Input type={showPwd2 ? 'text' : 'password'} placeholder="再次输入密码" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" className="pr-12 h-12 rounded-xl" />
                  <button type="button" onClick={() => setShowPwd2(!showPwd2)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showPwd2 ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {needsAgreement && (
                <AgreementCheckbox checked={agreedToTerms} onChange={setAgreedToTerms} hasUA={hasUserAgreement} hasPP={hasPrivacyPolicy} />
              )}

              <Button type="submit" disabled={loading || (needsAgreement && !agreedToTerms)}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-full font-bold shadow-xl shadow-primary/15 text-base">
                {loading && <Loader2 className="size-4 animate-spin mr-2" />}注册
              </Button>

              {hasOAuth && (
                <>
                  <div className="flex items-center gap-3 my-2">
                    <Separator className="flex-1" /><span className="text-xs text-slate-400">或</span><Separator className="flex-1" />
                  </div>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="w-full border-2 border-primary/20 text-primary hover:bg-primary/5 py-3 rounded-full font-bold transition-all">
                    其他注册选项
                  </button>
                </>
              )}
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-8">
            已有账户？{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function AgreementCheckbox({ checked, onChange, hasUA, hasPP }: {
  checked: boolean; onChange: (v: boolean) => void; hasUA: boolean; hasPP: boolean;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer mt-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary" />
      <span className="text-xs text-slate-500 leading-relaxed">
        我已阅读并同意
        {hasUA && <a href={withBasePath('/user-agreement')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mx-0.5">用户协议</a>}
        {hasUA && hasPP && '和'}
        {hasPP && <a href={withBasePath('/privacy-policy')} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mx-0.5">隐私政策</a>}
      </span>
    </label>
  );
}
