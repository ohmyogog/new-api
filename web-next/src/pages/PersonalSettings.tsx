import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Lock, Shield, Key, Copy, Check,
  Fingerprint, Trash2, Loader2, Link2, Unlink, LogOut,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

// ── helpers ──

interface UserInfo {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: number;
  status: number;
  quota: number;
  used_quota: number;
  request_count: number;
  group: string;
  aff_code: string;
  inviter_id: number;
  github_id: string;
  discord_id: string;
  oidc_id: string;
  wechat_id: string;
  telegram_id: string;
  linux_do_id: string;
}

interface OAuthBinding {
  provider_id: number;
  provider_name: string;
  provider_slug: string;
  provider_icon: string;
  provider_user_id: string;
}

interface TwoFASetupData {
  secret: string;
  qr_code_data: string;
  backup_codes: string[];
}

const roleName = (r: number) => r >= 100 ? '管理员' : r >= 10 ? '普通用户' : '访客';

// ── Passkey WebAuthn helpers (inline, no external dep) ──

function base64UrlToBuffer(b64url: string): ArrayBuffer {
  if (!b64url) return new ArrayBuffer(0);
  const padding = '='.repeat((4 - (b64url.length % 4)) % 4);
  const base64 = (b64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function prepareCreationOptions(payload: any) {
  const opts = payload?.publicKey || payload?.PublicKey || payload?.response || payload?.Response;
  if (!opts) throw new Error('无法解析 Passkey 注册参数');
  const pk: any = { ...opts, challenge: base64UrlToBuffer(opts.challenge), user: { ...opts.user, id: base64UrlToBuffer(opts.user?.id) } };
  if (Array.isArray(opts.excludeCredentials)) pk.excludeCredentials = opts.excludeCredentials.map((c: any) => ({ ...c, id: base64UrlToBuffer(c.id) }));
  if (Array.isArray(opts.attestationFormats) && opts.attestationFormats.length === 0) delete pk.attestationFormats;
  return pk;
}

function buildRegistrationResult(cred: PublicKeyCredential) {
  const resp = cred.response as AuthenticatorAttestationResponse;
  const transports = typeof resp.getTransports === 'function' ? resp.getTransports() : undefined;
  return {
    id: cred.id, rawId: bufferToBase64Url(cred.rawId), type: cred.type,
    authenticatorAttachment: cred.authenticatorAttachment,
    response: { attestationObject: bufferToBase64Url(resp.attestationObject), clientDataJSON: bufferToBase64Url(resp.clientDataJSON), transports },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}

// ── Section card wrapper ──
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-3xl border border-slate-100 soft-shadow p-8 ${className}`}>{children}</div>;
}

function SectionHeader({ icon, iconBg, title, subtitle }: { icon: React.ReactNode; iconBg: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`size-10 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function PersonalSettingsPage() {
  const navigate = useNavigate();

  // ── user info ──
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // ── profile edit ──
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // ── password ──
  const [passwords, setPasswords] = useState({ old: '', new_: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  // ── API token ──
  const [token, setToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── 2FA ──
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFASetupData | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  // ── Passkey ──
  const [passkeyEnabled, setPasskeyEnabled] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(true);

  // ── OAuth bindings ──
  const [oauthBindings, setOauthBindings] = useState<OAuthBinding[]>([]);

  // ── Delete account ──
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Fetch all data on mount ──
  const fetchUser = useCallback(async () => {
    try {
      const res = await API.get('/api/user/self');
      if (res.data.success) {
        const u = res.data.data;
        setUser(u);
        setDisplayName(u.display_name || '');
        setEmail(u.email || '');
      }
    } catch { toast.error('获取用户信息失败'); }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchUser();
      // parallel fetches
      const [twoFARes, passkeyRes, oauthRes] = await Promise.allSettled([
        API.get('/api/user/2fa/status'),
        API.get('/api/user/passkey'),
        API.get('/api/user/oauth/bindings'),
      ]);
      if (twoFARes.status === 'fulfilled' && twoFARes.value.data.success) {
        setTwoFAEnabled(twoFARes.value.data.data.enabled);
      }
      if (passkeyRes.status === 'fulfilled' && passkeyRes.value.data.success) {
        setPasskeyEnabled(passkeyRes.value.data.data.enabled);
      }
      if (oauthRes.status === 'fulfilled' && oauthRes.value.data.success) {
        setOauthBindings(oauthRes.value.data.data || []);
      }
      // check browser passkey support
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const ok = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setPasskeySupported(ok);
        } catch { setPasskeySupported(false); }
      } else {
        setPasskeySupported(false);
      }
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  // ── Profile save ──
  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const body: Record<string, string> = {};
      if (displayName !== (user?.display_name || '')) body.display_name = displayName;
      if (email !== (user?.email || '')) body.email = email;
      if (Object.keys(body).length === 0) { toast('没有需要保存的更改'); setProfileSaving(false); return; }
      const res = await API.put('/api/user/self', body);
      if (res.data.success) { toast.success('个人信息已更新'); await fetchUser(); }
      else toast.error(res.data.message || '更新失败');
    } catch { toast.error('更新失败'); }
    finally { setProfileSaving(false); }
  };

  // ── Password change ──
  const changePassword = async () => {
    if (!passwords.old || !passwords.new_) { toast.error('请填写所有密码字段'); return; }
    if (passwords.new_ !== passwords.confirm) { toast.error('两次输入的密码不一致'); return; }
    if (passwords.new_.length < 8) { toast.error('新密码至少 8 个字符'); return; }
    setPwSaving(true);
    try {
      const res = await API.put('/api/user/self', { original_password: passwords.old, password: passwords.new_ });
      if (res.data.success) { toast.success('密码已更新'); setPasswords({ old: '', new_: '', confirm: '' }); }
      else toast.error(res.data.message || '修改失败');
    } catch { toast.error('修改密码失败'); }
    finally { setPwSaving(false); }
  };

  // ── Generate API token ──
  const generateToken = async () => {
    setTokenLoading(true);
    try {
      const res = await API.get('/api/user/token');
      if (res.data.success) { setToken(res.data.data); toast.success('令牌已生成'); }
      else toast.error(res.data.message || '生成失败');
    } catch { toast.error('生成令牌失败'); }
    finally { setTokenLoading(false); }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('复制失败'); }
  };

  // ── 2FA setup ──
  const start2FASetup = async () => {
    setTwoFALoading(true);
    try {
      const res = await API.post('/api/user/2fa/setup');
      if (res.data.success) { setSetupData(res.data.data); setTwoFACode(''); }
      else toast.error(res.data.message || '初始化失败');
    } catch { toast.error('2FA 初始化失败'); }
    finally { setTwoFALoading(false); }
  };

  const enable2FA = async () => {
    if (twoFACode.length < 6) { toast.error('请输入 6 位验证码'); return; }
    setTwoFALoading(true);
    try {
      const res = await API.post('/api/user/2fa/enable', { code: twoFACode });
      if (res.data.success) { setTwoFAEnabled(true); setSetupData(null); setTwoFACode(''); toast.success('两步验证已启用'); }
      else toast.error(res.data.message || '启用失败');
    } catch { toast.error('启用 2FA 失败'); }
    finally { setTwoFALoading(false); }
  };

  const disable2FA = async () => {
    if (disableCode.length < 6) { toast.error('请输入验证码'); return; }
    setTwoFALoading(true);
    try {
      const res = await API.post('/api/user/2fa/disable', { code: disableCode });
      if (res.data.success) { setTwoFAEnabled(false); setShowDisable2FA(false); setDisableCode(''); toast.success('两步验证已禁用'); }
      else toast.error(res.data.message || '禁用失败');
    } catch { toast.error('禁用 2FA 失败'); }
    finally { setTwoFALoading(false); }
  };

  // ── Passkey register ──
  const registerPasskey = async () => {
    setPasskeyLoading(true);
    try {
      const beginRes = await API.post('/api/user/passkey/register/begin');
      if (!beginRes.data.success) { toast.error(beginRes.data.message || 'Passkey 注册失败'); setPasskeyLoading(false); return; }
      const publicKey = prepareCreationOptions(beginRes.data.data.options);
      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
      if (!credential) { toast.error('Passkey 创建被取消'); setPasskeyLoading(false); return; }
      const body = buildRegistrationResult(credential);
      const finishRes = await API.post('/api/user/passkey/register/finish', body);
      if (finishRes.data.success) { setPasskeyEnabled(true); toast.success('Passkey 注册成功'); }
      else toast.error(finishRes.data.message || '注册失败');
    } catch (e: any) { toast.error(e?.message || 'Passkey 注册失败'); }
    finally { setPasskeyLoading(false); }
  };

  const deletePasskey = async () => {
    setPasskeyLoading(true);
    try {
      const res = await API.delete('/api/user/passkey');
      if (res.data.success) { setPasskeyEnabled(false); toast.success('Passkey 已解绑'); }
      else toast.error(res.data.message || '解绑失败');
    } catch { toast.error('解绑 Passkey 失败'); }
    finally { setPasskeyLoading(false); }
  };

  // ── OAuth unbind ──
  const unbindOAuth = async (providerId: number, name: string) => {
    try {
      const res = await API.delete(`/api/user/oauth/bindings/${providerId}`);
      if (res.data.success) {
        setOauthBindings(prev => prev.filter(b => b.provider_id !== providerId));
        toast.success(`已解绑 ${name}`);
      } else toast.error(res.data.message || '解绑失败');
    } catch { toast.error('解绑失败'); }
  };

  // ── Delete account ──
  const deleteAccount = async () => {
    if (deleteConfirm !== user?.username) { toast.error('请输入正确的用户名确认'); return; }
    setDeleting(true);
    try {
      const res = await API.delete('/api/user/self');
      if (res.data.success) {
        toast.success('账户已删除');
        localStorage.removeItem('user');
        navigate('/login');
      } else toast.error(res.data.message || '删除失败');
    } catch { toast.error('删除账户失败'); }
    finally { setDeleting(false); }
  };

  // ── Logout ──
  const logout = async () => {
    try { await API.get('/api/user/logout'); } catch { /* ignore */ }
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Settings className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">个人设置</h1><p className="text-sm text-muted-foreground">管理你的账户和偏好</p></div>
        </div>
        <Button variant="outline" onClick={logout} className="border-2 border-primary/20 text-primary hover:bg-primary/5 rounded-2xl font-bold gap-2">
          <LogOut className="size-4" />退出登录
        </Button>
      </div>

      {/* Profile Card */}
      <SectionCard>
        <div className="flex items-center gap-6 mb-8">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {(user?.display_name || user?.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{user?.display_name || user?.username}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{user?.email || '未绑定邮箱'}</p>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary mt-2">
              <Shield className="size-3" />{roleName(user?.role ?? 0)}
            </span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">显示名称</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="显示名称" className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">邮箱</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱地址" className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary" />
          </div>
        </div>
        <Button onClick={saveProfile} disabled={profileSaving} className="mt-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-11 px-8">
          {profileSaving && <Loader2 className="size-4 animate-spin mr-2" />}保存信息
        </Button>
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Change Password */}
        <SectionCard>
          <SectionHeader icon={<Lock className="size-5 text-blue-500" />} iconBg="bg-blue-50" title="修改密码" />
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">当前密码</label>
              <Input type="password" value={passwords.old} onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))} placeholder="输入当前密码" className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">新密码</label>
              <Input type="password" value={passwords.new_} onChange={e => setPasswords(p => ({ ...p, new_: e.target.value }))} placeholder="输入新密码" className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">确认密码</label>
              <Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="再次输入新密码" className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary" />
            </div>
            <Button onClick={changePassword} disabled={pwSaving} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-11">
              {pwSaving && <Loader2 className="size-4 animate-spin mr-2" />}保存密码
            </Button>
          </div>
        </SectionCard>

        {/* API Token */}
        <SectionCard>
          <SectionHeader icon={<Key className="size-5 text-amber-500" />} iconBg="bg-amber-50" title="系统访问令牌" subtitle="用于 API 调用的身份验证" />
          {token && (
            <div className="flex items-center gap-2 mb-4">
              <Input readOnly value={token} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-mono flex-1" />
              <Button variant="outline" size="icon" onClick={copyToken} className="shrink-0 size-11 rounded-2xl border-2 border-primary/20 text-primary hover:bg-primary/5">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          )}
          <Button onClick={generateToken} disabled={tokenLoading} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-11">
            {tokenLoading && <Loader2 className="size-4 animate-spin mr-2" />}
            {token ? '重新生成令牌' : '生成令牌'}
          </Button>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 2FA */}
        <SectionCard>
          <SectionHeader icon={<Shield className="size-5 text-purple-500" />} iconBg="bg-purple-50" title="两步验证" subtitle={twoFAEnabled ? '已启用' : '未启用'} />
          {twoFAEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                  <Check className="size-3" />已启用
                </span>
              </div>
              <Button variant="outline" onClick={() => { setShowDisable2FA(true); setDisableCode(''); }} className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-bold h-11">
                禁用两步验证
              </Button>
            </div>
          ) : setupData ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">请使用验证器应用扫描二维码，然后输入 6 位验证码完成设置。</p>
              <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-100">
                <img src={setupData.qr_code_data} alt="2FA QR Code" className="size-48" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">密钥（手动输入）</label>
                <Input readOnly value={setupData.secret} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">验证码</label>
                <Input value={twoFACode} onChange={e => setTwoFACode(e.target.value)} placeholder="000000" maxLength={6} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-center tracking-[0.5em] font-mono" />
              </div>
              <Button onClick={enable2FA} disabled={twoFALoading || twoFACode.length < 6} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-11">
                {twoFALoading && <Loader2 className="size-4 animate-spin mr-2" />}确认启用
              </Button>
              {setupData.backup_codes?.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-700 mb-2">备用码（请妥善保存）</p>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono text-amber-800">
                    {setupData.backup_codes.map((c, i) => <span key={i}>{c}</span>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={start2FASetup} disabled={twoFALoading} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-11">
              {twoFALoading && <Loader2 className="size-4 animate-spin mr-2" />}设置两步验证
            </Button>
          )}
        </SectionCard>

        {/* Passkey */}
        <SectionCard>
          <SectionHeader icon={<Fingerprint className="size-5 text-emerald-500" />} iconBg="bg-emerald-50" title="Passkey 登录" subtitle={passkeyEnabled ? '已注册' : '未注册'} />
          {!passkeySupported && !passkeyEnabled && (
            <p className="text-sm text-amber-600 mb-4">当前设备不支持 Passkey</p>
          )}
          {passkeyEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                  <Check className="size-3" />已注册
                </span>
              </div>
              <Button variant="outline" onClick={deletePasskey} disabled={passkeyLoading} className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-bold h-11">
                {passkeyLoading && <Loader2 className="size-4 animate-spin mr-2" />}解绑 Passkey
              </Button>
            </div>
          ) : (
            <Button onClick={registerPasskey} disabled={passkeyLoading || !passkeySupported} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-11">
              {passkeyLoading && <Loader2 className="size-4 animate-spin mr-2" />}注册 Passkey
            </Button>
          )}
        </SectionCard>
      </div>

      {/* OAuth Bindings */}
      {oauthBindings.length > 0 && (
        <SectionCard>
          <SectionHeader icon={<Link2 className="size-5 text-sky-500" />} iconBg="bg-sky-50" title="第三方账号绑定" />
          <div className="space-y-3">
            {oauthBindings.map(b => (
              <div key={b.provider_id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                    {b.provider_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{b.provider_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.provider_user_id}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => unbindOAuth(b.provider_id, b.provider_name)} className="shrink-0 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold gap-1.5">
                  <Unlink className="size-3.5" />解绑
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Delete Account */}
      <SectionCard className="border-red-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 className="size-5 text-red-500" /></div>
            <div>
              <h2 className="text-lg font-bold text-red-600">删除账户</h2>
              <p className="text-sm text-muted-foreground">此操作不可逆，所有数据将被永久删除</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => { setShowDeleteDialog(true); setDeleteConfirm(''); }} className="border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-bold">
            删除账户
          </Button>
        </div>
      </SectionCard>

      {/* ── Dialogs ── */}

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable2FA} onOpenChange={setShowDisable2FA}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle>禁用两步验证</DialogTitle>
            <DialogDescription>请输入验证器应用中的验证码或备用码以禁用两步验证。</DialogDescription>
          </DialogHeader>
          <Input value={disableCode} onChange={e => setDisableCode(e.target.value)} placeholder="验证码" maxLength={20} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-center tracking-[0.3em] font-mono" />
          <DialogFooter className="gap-2">
            <DialogClose render={<Button variant="outline" className="rounded-2xl" />}>取消</DialogClose>
            <Button onClick={disable2FA} disabled={twoFALoading || disableCode.length < 6} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold">
              {twoFALoading && <Loader2 className="size-4 animate-spin mr-2" />}确认禁用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-red-600">删除账户</DialogTitle>
            <DialogDescription>此操作不可逆。请输入你的用户名 <strong>{user?.username}</strong> 以确认删除。</DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={`输入 ${user?.username} 确认`} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm" />
          <DialogFooter className="gap-2">
            <DialogClose render={<Button variant="outline" className="rounded-2xl" />}>取消</DialogClose>
            <Button onClick={deleteAccount} disabled={deleting || deleteConfirm !== user?.username} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold">
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}永久删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
