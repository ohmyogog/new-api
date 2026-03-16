import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Globe,
  UserPlus,
  Activity,
  FileText,
  Coins,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SettingsState {
  // General
  ServerAddress: string;
  TopUpLink: string;
  ChatLink: string;
  QuotaPerUnit: string;
  RetryTimes: string;
  DisplayInCurrencyEnabled: boolean;
  DisplayTokenStatEnabled: boolean;
  // Registration
  RegisterEnabled: boolean;
  PasswordRegisterEnabled: boolean;
  EmailVerificationEnabled: boolean;
  EmailDomainRestrictionEnabled: boolean;
  EmailDomainWhitelist: string;
  TurnstileCheckEnabled: boolean;
  TurnstileSiteKey: string;
  TurnstileSecretKey: string;
  // Monitoring
  ChannelDisableThreshold: string;
  AutomaticDisableChannelEnabled: boolean;
  AutomaticEnableChannelEnabled: boolean;
  // Log
  LogConsumeEnabled: boolean;
  // Credit Limit
  QuotaForNewUser: string;
  QuotaForInviter: string;
  QuotaForInvitee: string;
  PreConsumedQuota: string;
  QuotaRemindThreshold: string;
  QuotaWarningEnabled: boolean;
}

const BOOLEAN_KEYS = new Set<string>([
  'DisplayInCurrencyEnabled',
  'DisplayTokenStatEnabled',
  'RegisterEnabled',
  'PasswordRegisterEnabled',
  'EmailVerificationEnabled',
  'EmailDomainRestrictionEnabled',
  'TurnstileCheckEnabled',
  'AutomaticDisableChannelEnabled',
  'AutomaticEnableChannelEnabled',
  'LogConsumeEnabled',
  'QuotaWarningEnabled',
]);

const DEFAULT_STATE: SettingsState = {
  ServerAddress: '',
  TopUpLink: '',
  ChatLink: '',
  QuotaPerUnit: '',
  RetryTimes: '',
  DisplayInCurrencyEnabled: false,
  DisplayTokenStatEnabled: false,
  RegisterEnabled: false,
  PasswordRegisterEnabled: false,
  EmailVerificationEnabled: false,
  EmailDomainRestrictionEnabled: false,
  EmailDomainWhitelist: '',
  TurnstileCheckEnabled: false,
  TurnstileSiteKey: '',
  TurnstileSecretKey: '',
  ChannelDisableThreshold: '',
  AutomaticDisableChannelEnabled: false,
  AutomaticEnableChannelEnabled: false,
  LogConsumeEnabled: false,
  QuotaForNewUser: '',
  QuotaForInviter: '',
  QuotaForInvitee: '',
  PreConsumedQuota: '',
  QuotaRemindThreshold: '',
  QuotaWarningEnabled: false,
};

function toBoolean(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true' || v === '1';
  return Boolean(v);
}

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

function SectionCard({
  icon: Icon,
  title,
  saving,
  onSave,
  children,
}: {
  icon: React.ElementType;
  title: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="size-5 text-primary" />
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      {children}
      <div className="flex justify-end pt-2">
        <Button
          className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
          保存
        </Button>
      </div>
    </div>
  );
}

function Field({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</Label>
      {desc && <p className="text-xs text-slate-400">{desc}</p>}
      {children}
    </div>
  );
}

function SwitchField({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-slate-400">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

const inputCls = 'bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary';

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const snapshotRef = useRef<SettingsState>(DEFAULT_STATE);

  /* ---------- helpers ---------- */

  const set = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* ---------- load ---------- */

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/option/');
      const { success, message, data } = res.data;
      if (!success) {
        toast.error(message || '加载设置失败');
        return;
      }
      const next: Record<string, unknown> = { ...DEFAULT_STATE };
      if (Array.isArray(data)) {
        data.forEach((item: { key: string; value: string }) => {
          if (item.key in DEFAULT_STATE) {
            next[item.key] = BOOLEAN_KEYS.has(item.key)
              ? toBoolean(item.value)
              : item.value;
          }
        });
      } else if (data && typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          if (k in DEFAULT_STATE) {
            next[k] = BOOLEAN_KEYS.has(k) ? toBoolean(v) : v;
          }
        }
      }
      const s = next as unknown as SettingsState;
      setSettings(s);
      snapshotRef.current = structuredClone(s);
    } catch {
      toast.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* ---------- save ---------- */

  const saveKeys = useCallback(
    async (keys: (keyof SettingsState)[], sectionName: string) => {
      const changed = keys.filter(
        (k) => String(settings[k]) !== String(snapshotRef.current[k]),
      );
      if (changed.length === 0) {
        toast.success('没有需要保存的更改');
        return;
      }
      setSavingSection(sectionName);
      try {
        const requests = changed.map((k) =>
          API.put('/api/option/', {
            key: k,
            value: String(settings[k]),
          }),
        );
        const results = await Promise.all(requests);
        const anyFailed = results.some(
          (r) => r.data && r.data.success === false,
        );
        if (anyFailed) {
          toast.error('部分设置保存失败，请重试');
        } else {
          toast.success('保存成功');
          // Update snapshot so subsequent saves only diff against latest
          const updated = { ...snapshotRef.current };
          changed.forEach((k) => {
            (updated as Record<string, unknown>)[k] = settings[k];
          });
          snapshotRef.current = updated as SettingsState;
        }
      } catch {
        toast.error('保存失败，请重试');
      } finally {
        setSavingSection(null);
      }
    },
    [settings],
  );

  /* ---------- section key groups ---------- */

  const generalKeys: (keyof SettingsState)[] = [
    'ServerAddress', 'TopUpLink', 'ChatLink', 'QuotaPerUnit',
    'RetryTimes', 'DisplayInCurrencyEnabled', 'DisplayTokenStatEnabled',
  ];
  const registrationKeys: (keyof SettingsState)[] = [
    'RegisterEnabled', 'PasswordRegisterEnabled', 'EmailVerificationEnabled',
    'EmailDomainRestrictionEnabled', 'EmailDomainWhitelist',
    'TurnstileCheckEnabled', 'TurnstileSiteKey', 'TurnstileSecretKey',
  ];
  const monitoringKeys: (keyof SettingsState)[] = [
    'ChannelDisableThreshold', 'AutomaticDisableChannelEnabled',
    'AutomaticEnableChannelEnabled',
  ];
  const logKeys: (keyof SettingsState)[] = ['LogConsumeEnabled'];
  const creditKeys: (keyof SettingsState)[] = [
    'QuotaForNewUser', 'QuotaForInviter', 'QuotaForInvitee',
    'PreConsumedQuota', 'QuotaRemindThreshold', 'QuotaWarningEnabled',
  ];

  /* ---------- loading state ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ---------- render ---------- */

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">系统设置</h1>
            <p className="text-sm text-muted-foreground">配置系统参数</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-2 border-primary/20 text-primary hover:bg-primary/5 rounded-2xl font-bold"
          onClick={loadSettings}
        >
          <RefreshCw className="size-4 mr-1.5" />
          刷新
        </Button>
      </div>

      <Tabs defaultValue="general" orientation="horizontal" className="flex flex-col gap-6">
        <TabsList className="bg-slate-100 rounded-2xl p-1">
          {([
            ['general', '通用设置'],
            ['registration', '注册设置'],
            ['monitoring', '监控设置'],
            ['log', '日志设置'],
            ['credit', '额度设置'],
          ] as const).map(([v, l]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general" className="space-y-6">
          <SectionCard
            icon={Globe}
            title="通用设置"
            saving={savingSection === 'general'}
            onSave={() => saveKeys(generalKeys, 'general')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="服务器地址" desc="用于生成分享链接等，末尾不要加 /">
                <Input
                  className={inputCls}
                  value={settings.ServerAddress}
                  onChange={(e) => set('ServerAddress', e.target.value)}
                  placeholder="https://example.com"
                />
              </Field>
              <Field label="充值链接" desc="设置后将在用户界面显示充值入口">
                <Input
                  className={inputCls}
                  value={settings.TopUpLink}
                  onChange={(e) => set('TopUpLink', e.target.value)}
                  placeholder="https://buy.example.com"
                />
              </Field>
              <Field label="聊天链接" desc="设置后将在用户界面显示聊天入口">
                <Input
                  className={inputCls}
                  value={settings.ChatLink}
                  onChange={(e) => set('ChatLink', e.target.value)}
                  placeholder="https://chat.example.com"
                />
              </Field>
              <Field label="单位美元额度" desc="1 美元对应的额度数量">
                <Input
                  className={inputCls}
                  type="number"
                  value={settings.QuotaPerUnit}
                  onChange={(e) => set('QuotaPerUnit', e.target.value)}
                  placeholder="500000"
                />
              </Field>
              <Field label="失败重试次数" desc="请求失败后自动重试的次数">
                <Input
                  className={inputCls}
                  type="number"
                  value={settings.RetryTimes}
                  onChange={(e) => set('RetryTimes', e.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-4">
              <SwitchField
                label="以货币形式显示额度"
                desc="启用后额度将以美元形式展示"
                checked={settings.DisplayInCurrencyEnabled}
                onChange={(v) => set('DisplayInCurrencyEnabled', v)}
              />
              <SwitchField
                label="额度查询返回令牌额度"
                desc="启用后额度查询接口返回令牌额度而非用户额度"
                checked={settings.DisplayTokenStatEnabled}
                onChange={(v) => set('DisplayTokenStatEnabled', v)}
              />
            </div>
          </SectionCard>
        </TabsContent>

        {/* REGISTRATION TAB */}
        <TabsContent value="registration" className="space-y-6">
          <SectionCard
            icon={UserPlus}
            title="注册与验证"
            saving={savingSection === 'registration'}
            onSave={() => saveKeys(registrationKeys, 'registration')}
          >
            <div className="space-y-1">
              <SwitchField
                label="开放注册"
                desc="允许新用户注册账号"
                checked={settings.RegisterEnabled}
                onChange={(v) => set('RegisterEnabled', v)}
              />
              <SwitchField
                label="密码注册"
                desc="允许通过密码方式注册"
                checked={settings.PasswordRegisterEnabled}
                onChange={(v) => set('PasswordRegisterEnabled', v)}
              />
              <SwitchField
                label="邮箱验证"
                desc="注册时需要验证邮箱"
                checked={settings.EmailVerificationEnabled}
                onChange={(v) => set('EmailVerificationEnabled', v)}
              />
              <SwitchField
                label="邮箱域名限制"
                desc="限制注册邮箱的域名"
                checked={settings.EmailDomainRestrictionEnabled}
                onChange={(v) => set('EmailDomainRestrictionEnabled', v)}
              />
            </div>
            {settings.EmailDomainRestrictionEnabled && (
              <Field label="邮箱域名白名单" desc="允许的邮箱域名，用逗号分隔">
                <Textarea
                  className={inputCls}
                  value={settings.EmailDomainWhitelist}
                  onChange={(e) => set('EmailDomainWhitelist', e.target.value)}
                  placeholder="gmail.com,outlook.com,qq.com"
                  rows={3}
                />
              </Field>
            )}
            <div className="border-t border-slate-100 pt-4 space-y-1">
              <SwitchField
                label="Turnstile 验证"
                desc="启用 Cloudflare Turnstile 人机验证"
                checked={settings.TurnstileCheckEnabled}
                onChange={(v) => set('TurnstileCheckEnabled', v)}
              />
            </div>
            {settings.TurnstileCheckEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Turnstile Site Key">
                  <Input
                    className={inputCls}
                    value={settings.TurnstileSiteKey}
                    onChange={(e) => set('TurnstileSiteKey', e.target.value)}
                    placeholder="0x..."
                  />
                </Field>
                <Field label="Turnstile Secret Key">
                  <Input
                    className={inputCls}
                    type="password"
                    value={settings.TurnstileSecretKey}
                    onChange={(e) => set('TurnstileSecretKey', e.target.value)}
                    placeholder="0x..."
                  />
                </Field>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* MONITORING TAB */}
        <TabsContent value="monitoring" className="space-y-6">
          <SectionCard
            icon={Activity}
            title="渠道监控"
            saving={savingSection === 'monitoring'}
            onSave={() => saveKeys(monitoringKeys, 'monitoring')}
          >
            <Field label="渠道禁用阈值" desc="测试所有渠道时，超过此响应时间（秒）将自动禁用，0 表示不限制">
              <Input
                className={inputCls}
                type="number"
                value={settings.ChannelDisableThreshold}
                onChange={(e) => set('ChannelDisableThreshold', e.target.value)}
                placeholder="0"
              />
            </Field>
            <div className="space-y-1 border-t border-slate-100 pt-4">
              <SwitchField
                label="失败自动禁用渠道"
                desc="渠道测试失败时自动禁用该渠道"
                checked={settings.AutomaticDisableChannelEnabled}
                onChange={(v) => set('AutomaticDisableChannelEnabled', v)}
              />
              <SwitchField
                label="成功自动启用渠道"
                desc="渠道测试成功时自动启用该渠道"
                checked={settings.AutomaticEnableChannelEnabled}
                onChange={(v) => set('AutomaticEnableChannelEnabled', v)}
              />
            </div>
          </SectionCard>
        </TabsContent>

        {/* LOG TAB */}
        <TabsContent value="log" className="space-y-6">
          <SectionCard
            icon={FileText}
            title="日志设置"
            saving={savingSection === 'log'}
            onSave={() => saveKeys(logKeys, 'log')}
          >
            <SwitchField
              label="启用额度消费日志"
              desc="记录每次请求的额度消费详情"
              checked={settings.LogConsumeEnabled}
              onChange={(v) => set('LogConsumeEnabled', v)}
            />
          </SectionCard>
        </TabsContent>

        {/* CREDIT LIMIT TAB */}
        <TabsContent value="credit" className="space-y-6">
          <SectionCard
            icon={Coins}
            title="额度设置"
            saving={savingSection === 'credit'}
            onSave={() => saveKeys(creditKeys, 'credit')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="新用户初始额度" desc="新注册用户获得的初始额度">
                <Input
                  className={inputCls}
                  type="number"
                  value={settings.QuotaForNewUser}
                  onChange={(e) => set('QuotaForNewUser', e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="邀请者奖励额度" desc="邀请新用户注册后邀请者获得的额度">
                <Input
                  className={inputCls}
                  type="number"
                  value={settings.QuotaForInviter}
                  onChange={(e) => set('QuotaForInviter', e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="被邀请者奖励额度" desc="通过邀请码注册的新用户获得的额度">
                <Input
                  className={inputCls}
                  type="number"
                  value={settings.QuotaForInvitee}
                  onChange={(e) => set('QuotaForInvitee', e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="请求预扣费额度" desc="请求开始前预扣的额度，结束后多退少补">
                <Input
                  className={inputCls}
                  type="number"
                  value={settings.PreConsumedQuota}
                  onChange={(e) => set('PreConsumedQuota', e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="额度提醒阈值" desc="用户额度低于此值时发送邮件提醒">
                <Input
                  className={inputCls}
                  type="number"
                  value={settings.QuotaRemindThreshold}
                  onChange={(e) => set('QuotaRemindThreshold', e.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <SwitchField
                label="启用额度预警"
                desc="当用户额度低于阈值时发送邮件通知"
                checked={settings.QuotaWarningEnabled}
                onChange={(v) => set('QuotaWarningEnabled', v)}
              />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
