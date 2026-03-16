import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings, Lock, Shield, Key, Copy, Check,
  Fingerprint, Trash2, Loader2, Link2, LogOut,
  Mail, Globe, Bell, User, Languages, DollarSign,
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
  setting?: string;
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

function renderQuota(quota: number, digits = 2): string {
  const quotaPerUnit = parseFloat(localStorage.getItem('quota_per_unit') || '500000');
  const displayType = localStorage.getItem('quota_display_type') || 'USD';
  if (displayType === 'TOKENS') return quota.toLocaleString();
  const resultUSD = quota / quotaPerUnit;
  let symbol = '$'; let value = resultUSD;
  if (displayType === 'CNY') { try { const s = JSON.parse(localStorage.getItem('status') || '{}'); value = resultUSD * (s?.usd_exchange_rate || 7); } catch { /* ignore */ } symbol = '¥'; }
  return symbol + value.toFixed(digits);
}

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

// ── Tab component ──
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 flex items-center gap-1.5 text-sm cursor-pointer transition-colors ${active ? 'text-primary border-b-2 border-primary font-medium' : 'text-muted-foreground border-b-2 border-transparent hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}

// ── Binding item ──
function BindingItem({ icon, name, status, actionLabel, onAction }: { icon: React.ReactNode; name: string; status: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="border border-slate-100 rounded-xl p-3 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">{status}</div>
        </div>
      </div>
      {actionLabel === '绑定' && onAction ? (
        <button onClick={onAction} className="text-xs px-3 py-1 text-primary border border-primary/20 rounded-full hover:bg-primary/5 transition">绑定</button>
      ) : actionLabel === '解绑' && onAction ? (
        <button onClick={onAction} className="text-xs px-3 py-1 text-red-500 border border-red-200 rounded-full hover:bg-red-50 transition">解绑</button>
      ) : (
        <span className="text-xs px-3 py-1 text-slate-400 bg-slate-50 rounded-full">未启用</span>
      )}
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

  // ── Email binding ──
  const [showEmailBind, setShowEmailBind] = useState(false);
  const [bindEmailAddr, setBindEmailAddr] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // ── Language ──
  const [language, setLanguage] = useState(() => localStorage.getItem('i18nextLng') || 'zh');

  // ── Notification settings ──
  interface NotifySettings {
    warningType: string;
    warningThreshold: number;
    webhookUrl: string;
    webhookSecret: string;
    notificationEmail: string;
    barkUrl: string;
    gotifyUrl: string;
    gotifyToken: string;
    gotifyPriority: number;
    upstreamModelUpdateNotifyEnabled: boolean;
    acceptUnsetModelRatioModel: boolean;
    recordIpLog: boolean;
  }

  const [notifySettings, setNotifySettings] = useState<NotifySettings>({
    warningType: 'email',
    warningThreshold: 500000,
    webhookUrl: '',
    webhookSecret: '',
    notificationEmail: '',
    barkUrl: '',
    gotifyUrl: '',
    gotifyToken: '',
    gotifyPriority: 5,
    upstreamModelUpdateNotifyEnabled: false,
    acceptUnsetModelRatioModel: false,
    recordIpLog: false,
  });
  const [notifySaving, setNotifySaving] = useState(false);

  // ── Tab state ──
  const [leftTab, setLeftTab] = useState<'binding' | 'security'>('binding');
  const [rightTab, setRightTab] = useState<'notification' | 'pricing' | 'privacy' | 'sidebar'>('notification');

  // ── Fetch all data on mount ──
  const fetchUser = useCallback(async () => {
    try {
      const res = await API.get('/api/user/self');
      if (res.data.success) {
        const u = res.data.data;
        setUser(u);
        setDisplayName(u.display_name || '');
        setEmail(u.email || '');
        // Parse notification settings
        if (u.setting) {
          try {
            const s = typeof u.setting === 'string' ? JSON.parse(u.setting) : u.setting;
            setNotifySettings({
              warningType: s.notify_type || 'email',
              warningThreshold: s.quota_warning_threshold || 500000,
              webhookUrl: s.webhook_url || '',
              webhookSecret: s.webhook_secret || '',
              notificationEmail: s.notification_email || '',
              barkUrl: s.bark_url || '',
              gotifyUrl: s.gotify_url || '',
              gotifyToken: s.gotify_token || '',
              gotifyPriority: s.gotify_priority ?? 5,
              upstreamModelUpdateNotifyEnabled: s.upstream_model_update_notify_enabled === true,
              acceptUnsetModelRatioModel: s.accept_unset_model_ratio_model || false,
              recordIpLog: s.record_ip_log || false,
            });
          } catch { /* ignore */ }
        }
      }
    } catch { toast.error('获取用户信息失败'); }
  }, []);

  // ── Email countdown ──
  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setTimeout(() => setEmailCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  // ── Language handler ──
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    try { (window as any).i18next?.changeLanguage?.(lang); } catch {}
  };

  // ── Email binding handlers ──
  const sendEmailCode = async () => {
    if (!bindEmailAddr) { toast.error('请输入邮箱'); return; }
    setEmailSending(true);
    try {
      const res = await API.get(`/api/verification?email=${bindEmailAddr}`);
      if (res.data.success) { toast.success('验证码已发送，请检查邮箱'); setEmailCountdown(60); }
      else toast.error(res.data.message || '发送失败');
    } catch { toast.error('发送验证码失败'); }
    finally { setEmailSending(false); }
  };

  const bindEmailAction = async () => {
    if (!emailCode) { toast.error('请输入验证码'); return; }
    setEmailSending(true);
    try {
      const res = await API.get(`/api/oauth/email/bind?email=${bindEmailAddr}&code=${emailCode}`);
      if (res.data.success) { toast.success('邮箱绑定成功'); setShowEmailBind(false); await fetchUser(); }
      else toast.error(res.data.message || '绑定失败');
    } catch { toast.error('绑定失败'); }
    finally { setEmailSending(false); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchUser();
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

  // ── Save notification / pricing / privacy settings ──
  const saveNotifySettings = async () => {
    setNotifySaving(true);
    try {
      const res = await API.put('/api/user/setting', {
        notify_type: notifySettings.warningType,
        quota_warning_threshold: parseFloat(String(notifySettings.warningThreshold)),
        webhook_url: notifySettings.webhookUrl,
        webhook_secret: notifySettings.webhookSecret,
        notification_email: notifySettings.notificationEmail,
        bark_url: notifySettings.barkUrl,
        gotify_url: notifySettings.gotifyUrl,
        gotify_token: notifySettings.gotifyToken,
        gotify_priority: parseInt(String(notifySettings.gotifyPriority)) || 5,
        upstream_model_update_notify_enabled: notifySettings.upstreamModelUpdateNotifyEnabled,
        accept_unset_model_ratio_model: notifySettings.acceptUnsetModelRatioModel,
        record_ip_log: notifySettings.recordIpLog,
      });
      if (res.data.success) { toast.success('设置保存成功'); await fetchUser(); }
      else toast.error(res.data.message || '保存失败');
    } catch { toast.error('保存设置失败'); }
    finally { setNotifySaving(false); }
  };

  // ── helper: get oauth binding for a provider slug ──
  const getBinding = (slug: string) => oauthBindings.find(b => b.provider_slug === slug);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const cardStyle = "bg-white rounded-3xl [box-shadow:0_4px_20px_rgba(242,107,72,0.08)] [border:1px_solid_rgba(242,107,72,0.1)]";

  return (
    <div className="space-y-6">
      {/* ═══ Top Header Card ═══ */}
      <header className={`${cardStyle} overflow-hidden`}>
        {/* Wave Banner */}
        <div className="relative h-32 md:h-40 bg-gradient-to-br from-[#f89b7b] to-primary overflow-hidden p-6 flex items-end">
          {/* Wave SVG overlay */}
          <div className="absolute inset-0 opacity-90" style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 1000 200' xmlns='http://www.w3.org/2000/svg'><path d='M0 50 Q 250 150 500 50 T 1000 50 L 1000 200 L 0 200 Z' fill='rgba(255,255,255,0.15)'/><path d='M0 100 Q 250 0 500 100 T 1000 100 L 1000 200 L 0 200 Z' fill='rgba(255,255,255,0.1)'/></svg>")`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white/20">
              {(user?.display_name || user?.username || '?').substring(0, 2).toUpperCase()}
            </div>
            <div className="text-white">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{user?.display_name || user?.username}</h1>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs backdrop-blur-sm">{roleName(user?.role ?? 0)}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs backdrop-blur-sm">ID: {user?.id}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Bar: Balance & Stats */}
        <div className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-3xl font-bold text-primary">{renderQuota(user?.quota ?? 0)}</span>
            <Link to="/topup" className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md border border-primary/20 hover:bg-primary/15 transition">充值</Link>
          </div>
          <div className="flex items-center gap-2 md:gap-6 text-sm text-muted-foreground bg-primary/5 p-2 md:p-0 rounded-lg w-full md:w-auto justify-around md:bg-transparent">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              <span>已消耗: {renderQuota(user?.used_quota ?? 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              <span>请求次数: {user?.request_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              <span>分组: {user?.group || 'default'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Main Grid ═══ */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Account Management Card */}
          <section className={`${cardStyle} p-6`}>
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><User className="size-5" /></div>
              <div>
                <h2 className="font-bold">账户管理</h2>
                <p className="text-xs text-muted-foreground mt-0.5">管理账号、安全设置和身份验证</p>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-100 mb-5 text-sm">
              <TabButton active={leftTab === 'binding'} onClick={() => setLeftTab('binding')}>
                <Link2 className="size-4" /><span>账号绑定</span>
              </TabButton>
              <TabButton active={leftTab === 'security'} onClick={() => setLeftTab('security')}>
                <Shield className="size-4" /><span>安全设置</span>
              </TabButton>
            </div>

            {leftTab === 'binding' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email binding with edit */}
                <div className="border border-slate-100 rounded-xl p-3 bg-white sm:col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="size-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">个人信息</div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="显示名称" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱地址" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <Button onClick={saveProfile} disabled={profileSaving} className="mt-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-md shadow-primary/20 h-8 text-xs px-4">
                    {profileSaving && <Loader2 className="size-3 animate-spin mr-1" />}保存信息
                  </Button>
                </div>
                {/* Email binding */}
                <BindingItem
                  icon={<Mail className="size-5 text-muted-foreground" />}
                  name="邮箱"
                  status={user?.email ? user.email : '未绑定'}
                  actionLabel={user?.email ? undefined : '绑定'}
                  onAction={user?.email ? undefined : () => { setBindEmailAddr(''); setEmailCode(''); setShowEmailBind(true); }}
                />
                {/* OAuth bindings grid */}
                {(['wechat', 'github', 'discord', 'oidc', 'telegram', 'linux_do'] as const).map(slug => {
                  const labels: Record<string, string> = { wechat: '微信', github: 'GitHub', discord: 'Discord', oidc: 'OIDC', telegram: 'Telegram', linux_do: 'LinuxDO' };
                  const binding = getBinding(slug);
                  const legacyId = user?.[`${slug}_id` as keyof UserInfo] as string | undefined;
                  const isBound = !!binding || !!legacyId;
                  return (
                    <BindingItem
                      key={slug}
                      icon={<Globe className="size-5 text-muted-foreground" />}
                      name={labels[slug] || slug}
                      status={isBound ? (binding?.provider_user_id || '已绑定') : '未绑定'}
                      actionLabel={isBound && binding ? '解绑' : undefined}
                      onAction={isBound && binding ? () => unbindOAuth(binding.provider_id, binding.provider_name) : undefined}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Password change */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Lock className="size-4 text-primary" />修改密码</h3>
                  <div className="space-y-3">
                    <Input type="password" value={passwords.old} onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))} placeholder="当前密码" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                    <Input type="password" value={passwords.new_} onChange={e => setPasswords(p => ({ ...p, new_: e.target.value }))} placeholder="新密码" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                    <Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="确认新密码" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                    <Button onClick={changePassword} disabled={pwSaving} className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-md shadow-primary/20 h-10">
                      {pwSaving && <Loader2 className="size-4 animate-spin mr-2" />}保存密码
                    </Button>
                  </div>
                </div>
                {/* 2FA */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Shield className="size-4 text-primary" />两步验证 {twoFAEnabled && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">已启用</span>}</h3>
                  {twoFAEnabled ? (
                    <Button variant="outline" onClick={() => { setShowDisable2FA(true); setDisableCode(''); }} className="w-full border border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-10">禁用两步验证</Button>
                  ) : setupData ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">请使用验证器应用扫描二维码，然后输入 6 位验证码。</p>
                      <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-100"><img src={setupData.qr_code_data} alt="2FA QR" className="size-40" /></div>
                      <Input readOnly value={setupData.secret} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono" />
                      <Input value={twoFACode} onChange={e => setTwoFACode(e.target.value)} placeholder="000000" maxLength={6} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.5em] font-mono" />
                      <Button onClick={enable2FA} disabled={twoFALoading || twoFACode.length < 6} className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-medium h-10">
                        {twoFALoading && <Loader2 className="size-4 animate-spin mr-2" />}确认启用
                      </Button>
                      {setupData.backup_codes?.length > 0 && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <p className="text-xs font-bold text-amber-700 mb-2">备用码（请妥善保存）</p>
                          <div className="grid grid-cols-2 gap-1 text-xs font-mono text-amber-800">{setupData.backup_codes.map((c, i) => <span key={i}>{c}</span>)}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button onClick={start2FASetup} disabled={twoFALoading} className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-medium h-10">
                      {twoFALoading && <Loader2 className="size-4 animate-spin mr-2" />}设置两步验证
                    </Button>
                  )}
                </div>
                {/* Passkey */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Fingerprint className="size-4 text-primary" />Passkey 登录 {passkeyEnabled && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">已注册</span>}</h3>
                  {!passkeySupported && !passkeyEnabled && <p className="text-xs text-amber-600 mb-2">当前设备不支持 Passkey</p>}
                  {passkeyEnabled ? (
                    <Button variant="outline" onClick={deletePasskey} disabled={passkeyLoading} className="w-full border border-red-200 text-red-600 hover:bg-red-50 rounded-lg h-10">
                      {passkeyLoading && <Loader2 className="size-4 animate-spin mr-2" />}解绑 Passkey
                    </Button>
                  ) : (
                    <Button onClick={registerPasskey} disabled={passkeyLoading || !passkeySupported} className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-medium h-10">
                      {passkeyLoading && <Loader2 className="size-4 animate-spin mr-2" />}注册 Passkey
                    </Button>
                  )}
                </div>

                {/* API Token */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Key className="size-4 text-primary" />系统访问令牌</h3>
                  <p className="text-xs text-muted-foreground mb-3">用于 API 调用的身份验证</p>
                  {token && (
                    <div className="flex items-center gap-2 mb-3">
                      <Input readOnly value={token} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono flex-1" />
                      <Button variant="outline" size="icon" onClick={copyToken} className="shrink-0 size-9 rounded-lg border border-primary/20 text-primary hover:bg-primary/5">
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                  )}
                  <Button onClick={generateToken} disabled={tokenLoading} className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-medium h-9 text-sm">
                    {tokenLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                    {token ? '重新生成令牌' : '生成令牌'}
                  </Button>
                </div>

                {/* Delete Account & Logout */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between p-3 border border-red-100 rounded-xl bg-red-50/30">
                    <div className="flex items-center gap-2">
                      <Trash2 className="size-4 text-red-500" />
                      <div>
                        <div className="text-sm font-medium text-red-600">删除账户</div>
                        <div className="text-xs text-muted-foreground">不可逆操作</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setShowDeleteDialog(true); setDeleteConfirm(''); }} className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs">
                      删除
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <LogOut className="size-4 text-muted-foreground" />
                      <div className="text-sm font-medium">退出登录</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout} className="border border-slate-200 rounded-lg text-xs">退出</Button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Preference Settings Card */}
          <section className={`${cardStyle} p-6`}>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Settings className="size-5" /></div>
              <div>
                <h2 className="font-bold">偏好设置</h2>
                <p className="text-xs text-muted-foreground mt-0.5">界面语言和其他个人偏好</p>
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-start gap-3">
                <Languages className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">语言偏好</div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-xs">选择界面语言，设置将同步到所有设备</div>
                </div>
              </div>
              <select
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                className="text-sm bg-primary/5 border-none text-primary rounded-md py-1.5 pl-3 pr-8 focus:ring-0 cursor-pointer"
              >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </section>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-7">
          <section className={`${cardStyle} p-6 h-full flex flex-col`}>
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Bell className="size-5" /></div>
              <div>
                <h2 className="font-bold">通知与高级设置</h2>
                <p className="text-xs text-muted-foreground mt-0.5">通知、令牌和账户安全相关设置</p>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-slate-100 mb-6 text-sm">
              <TabButton active={rightTab === 'notification'} onClick={() => setRightTab('notification')}>
                <Bell className="size-4" /><span>通知配置</span>
              </TabButton>
              <TabButton active={rightTab === 'pricing'} onClick={() => setRightTab('pricing')}>
                <DollarSign className="size-4" /><span>价格设置</span>
              </TabButton>
              <TabButton active={rightTab === 'privacy'} onClick={() => setRightTab('privacy')}>
                <Shield className="size-4" /><span>隐私设置</span>
              </TabButton>
              <TabButton active={rightTab === 'sidebar'} onClick={() => setRightTab('sidebar')}>
                <Settings className="size-4" /><span>边栏设置</span>
              </TabButton>
            </div>

            <div className="flex-grow">
              {rightTab === 'notification' && (
                <div className="space-y-6">
                  {/* 通知方式 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">通知方式 <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {([['email', '邮件通知'], ['webhook', 'Webhook通知'], ['bark', 'Bark通知'], ['gotify', 'Gotify通知']] as const).map(([val, label]) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="warningType" value={val} checked={notifySettings.warningType === val}
                            onChange={() => setNotifySettings(p => ({ ...p, warningType: val }))}
                            className="text-primary focus:ring-primary" />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* 额度预警阈值 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      额度预警阈值 等价金额：{renderQuota(notifySettings.warningThreshold)} <span className="text-red-500">*</span>
                    </label>
                    <Input type="number" value={String(notifySettings.warningThreshold)}
                      onChange={e => setNotifySettings(p => ({ ...p, warningThreshold: Number(e.target.value) || 0 }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm max-w-xs" />
                    <p className="text-xs text-muted-foreground mt-2">当钱包或订阅剩余额度低于此数值时，系统将通过选择的方式发送通知</p>
                  </div>
                  {/* Conditional fields */}
                  {notifySettings.warningType === 'email' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">通知邮箱</label>
                      <Input value={notifySettings.notificationEmail}
                        onChange={e => setNotifySettings(p => ({ ...p, notificationEmail: e.target.value }))}
                        placeholder="留空则使用账号绑定的邮箱"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                      <p className="text-xs text-muted-foreground mt-2">设置用于接收额度预警的邮箱地址，不填则使用账号绑定的邮箱</p>
                    </div>
                  )}
                  {notifySettings.warningType === 'webhook' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Webhook地址</label>
                        <Input value={notifySettings.webhookUrl}
                          onChange={e => setNotifySettings(p => ({ ...p, webhookUrl: e.target.value }))}
                          placeholder="https://example.com/webhook"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                        <p className="text-xs text-muted-foreground mt-2">只支持HTTPS，系统将以POST方式发送通知</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">接口凭证</label>
                        <Input value={notifySettings.webhookSecret}
                          onChange={e => setNotifySettings(p => ({ ...p, webhookSecret: e.target.value }))}
                          placeholder="请输入密钥"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                        <p className="text-xs text-muted-foreground mt-2">密钥将以Bearer方式添加到请求头中</p>
                      </div>
                    </>
                  )}
                  {notifySettings.warningType === 'bark' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Bark推送URL</label>
                      <Input value={notifySettings.barkUrl}
                        onChange={e => setNotifySettings(p => ({ ...p, barkUrl: e.target.value }))}
                        placeholder="https://api.day.app/yourkey/{{title}}/{{content}}"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                      <p className="text-xs text-muted-foreground mt-2">支持HTTP和HTTPS，模板变量: {'{{title}}'} (通知标题), {'{{content}}'} (通知内容)</p>
                    </div>
                  )}
                  {notifySettings.warningType === 'gotify' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Gotify服务器地址</label>
                        <Input value={notifySettings.gotifyUrl}
                          onChange={e => setNotifySettings(p => ({ ...p, gotifyUrl: e.target.value }))}
                          placeholder="https://gotify.example.com"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Gotify应用令牌</label>
                        <Input value={notifySettings.gotifyToken}
                          onChange={e => setNotifySettings(p => ({ ...p, gotifyToken: e.target.value }))}
                          placeholder="请输入Gotify应用令牌"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">消息优先级</label>
                        <select value={notifySettings.gotifyPriority}
                          onChange={e => setNotifySettings(p => ({ ...p, gotifyPriority: Number(e.target.value) }))}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                          <option value={0}>0 - 最低</option>
                          <option value={2}>2 - 低</option>
                          <option value={5}>5 - 正常（默认）</option>
                          <option value={8}>8 - 高</option>
                          <option value={10}>10 - 最高</option>
                        </select>
                      </div>
                    </>
                  )}
                  {/* Admin-only: upstream model update notify */}
                  {(user?.role ?? 0) >= 10 && (
                    <div className="flex items-center justify-between border border-slate-100 rounded-xl p-4">
                      <div>
                        <div className="text-sm font-medium">接收上游模型更新通知</div>
                        <div className="text-xs text-muted-foreground mt-0.5">仅管理员可用。开启后，当系统检测到上游模型变更时发送通知</div>
                      </div>
                      <button onClick={() => setNotifySettings(p => ({ ...p, upstreamModelUpdateNotifyEnabled: !p.upstreamModelUpdateNotifyEnabled }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifySettings.upstreamModelUpdateNotifyEnabled ? 'bg-primary' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifySettings.upstreamModelUpdateNotifyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {rightTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border border-slate-100 rounded-xl p-4">
                    <div>
                      <div className="text-sm font-medium">接受未设置价格模型</div>
                      <div className="text-xs text-muted-foreground mt-0.5">当模型没有设置价格时仍接受调用，仅当您信任该网站时使用</div>
                    </div>
                    <button onClick={() => setNotifySettings(p => ({ ...p, acceptUnsetModelRatioModel: !p.acceptUnsetModelRatioModel }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifySettings.acceptUnsetModelRatioModel ? 'bg-primary' : 'bg-slate-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifySettings.acceptUnsetModelRatioModel ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {rightTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border border-slate-100 rounded-xl p-4">
                    <div>
                      <div className="text-sm font-medium">记录请求与错误日志IP</div>
                      <div className="text-xs text-muted-foreground mt-0.5">开启后，仅"消费"和"错误"日志将记录您的客户端IP地址</div>
                    </div>
                    <button onClick={() => setNotifySettings(p => ({ ...p, recordIpLog: !p.recordIpLog }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifySettings.recordIpLog ? 'bg-primary' : 'bg-slate-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifySettings.recordIpLog ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {rightTab === 'sidebar' && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground mb-4">您可以个性化设置侧边栏要显示的功能模块</p>
                  <p className="text-sm text-muted-foreground">边栏设置功能即将上线，敬请期待。</p>
                </div>
              )}
            </div>

            {(['notification', 'pricing', 'privacy'] as const).includes(rightTab as 'notification') && (
              <div className="mt-8 flex justify-end">
                <Button onClick={saveNotifySettings} disabled={notifySaving}
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-md shadow-primary/20 px-6">
                  {notifySaving && <Loader2 className="size-4 animate-spin mr-2" />}保存设置
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ═══ Dialogs ═══ */}
      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable2FA} onOpenChange={setShowDisable2FA}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle>禁用两步验证</DialogTitle>
            <DialogDescription>请输入验证器应用中的验证码或备用码以禁用两步验证。</DialogDescription>
          </DialogHeader>
          <Input value={disableCode} onChange={e => setDisableCode(e.target.value)} placeholder="验证码" maxLength={20} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.3em] font-mono" />
          <DialogFooter className="gap-2">
            <DialogClose render={<Button variant="outline" className="rounded-xl" />}>取消</DialogClose>
            <Button onClick={disable2FA} disabled={twoFALoading || disableCode.length < 6} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium">
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
          <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={`输入 ${user?.username} 确认`} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          <DialogFooter className="gap-2">
            <DialogClose render={<Button variant="outline" className="rounded-xl" />}>取消</DialogClose>
            <Button onClick={deleteAccount} disabled={deleting || deleteConfirm !== user?.username} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium">
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}永久删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Binding Dialog */}
      <Dialog open={showEmailBind} onOpenChange={setShowEmailBind}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="size-5 text-primary" />绑定邮箱地址</DialogTitle>
            <DialogDescription>输入邮箱地址并验证后完成绑定</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={bindEmailAddr} onChange={e => setBindEmailAddr(e.target.value)} placeholder="输入邮箱地址" type="email" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <Button onClick={sendEmailCode} disabled={emailSending || emailCountdown > 0} className="bg-primary hover:bg-primary/90 text-white rounded-lg text-xs px-4 shrink-0">
                {emailCountdown > 0 ? `重新发送 (${emailCountdown})` : '获取验证码'}
              </Button>
            </div>
            <Input value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="输入验证码" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose><Button variant="outline" className="rounded-lg">取消</Button></DialogClose>
            <Button onClick={bindEmailAction} disabled={emailSending || !emailCode} className="bg-primary hover:bg-primary/90 text-white rounded-lg font-medium">
              {emailSending && <Loader2 className="size-4 animate-spin mr-2" />}确认绑定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
