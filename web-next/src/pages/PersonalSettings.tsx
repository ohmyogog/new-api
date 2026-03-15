import { useState } from 'react';
import {
  Settings, User, Lock, Mail, Shield, Palette, Globe, Bell,
  Camera, Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ── Mock user ──
const mockUser = {
  id: 1, username: 'Dev', email: 'dev@example.com',
  display_name: 'Developer', role: 100,
  avatar: '', created_time: Math.floor(Date.now() / 1000) - 86400 * 90,
};
const roleName = (r: number) => r >= 100 ? '管理员' : r >= 10 ? '普通用户' : '访客';

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function PersonalSettingsPage() {
  const [passwords, setPasswords] = useState({ current: '', new_: '', confirm: '' });
  const [email, setEmail] = useState(mockUser.email);
  const [twoFA, setTwoFA] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, browser: false });
  const [saved, setSaved] = useState<string | null>(null);

  const flash = (msg: string) => { setSaved(msg); setTimeout(() => setSaved(null), 2000); };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Settings className="size-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold">个人设置</h1><p className="text-sm text-muted-foreground">管理你的账户和偏好</p></div>
      </div>

      {/* Toast */}
      {saved && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <Check className="size-4" />{saved}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-2xl font-bold">
              {mockUser.username.charAt(0).toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 size-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
              <Camera className="size-3.5" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">{mockUser.display_name || mockUser.username}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{mockUser.email}</p>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary mt-2">
              <Shield className="size-3" />{roleName(mockUser.role)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Change Password */}
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center"><Lock className="size-5 text-blue-500" /></div>
            <h2 className="text-lg font-bold">修改密码</h2>
          </div>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-1.5 block">当前密码</label><Input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="输入当前密码" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">新密码</label><Input type="password" value={passwords.new_} onChange={e => setPasswords(p => ({ ...p, new_: e.target.value }))} placeholder="输入新密码" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">确认密码</label><Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="再次输入新密码" /></div>
            <Button onClick={() => flash('密码已更新')} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-11">保存密码</Button>
          </div>
        </div>

        {/* Email & 2FA */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Mail className="size-5 text-emerald-500" /></div>
              <h2 className="text-lg font-bold">绑定邮箱</h2>
            </div>
            <div className="space-y-4">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="输入邮箱地址" />
              <Button onClick={() => flash('邮箱已更新')} className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-11">保存邮箱</Button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center"><Shield className="size-5 text-purple-500" /></div>
                <div><h2 className="text-lg font-bold">两步验证</h2><p className="text-sm text-muted-foreground">增强账户安全性</p></div>
              </div>
              <ToggleSwitch checked={twoFA} onChange={setTwoFA} />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
        <h2 className="text-lg font-bold mb-6">偏好设置</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center"><Palette className="size-5 text-amber-500" /></div>
              <div><p className="text-sm font-bold">深色模式</p><p className="text-xs text-muted-foreground">切换界面主题</p></div>
            </div>
            <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
          </div>
          <div className="border-t border-slate-50" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-sky-50 flex items-center justify-center"><Globe className="size-5 text-sky-500" /></div>
              <div><p className="text-sm font-bold">语言</p><p className="text-xs text-muted-foreground">界面显示语言</p></div>
            </div>
            <span className="text-sm text-muted-foreground bg-slate-50 px-4 py-2 rounded-xl">简体中文</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-rose-50 flex items-center justify-center"><Bell className="size-5 text-rose-500" /></div>
          <h2 className="text-lg font-bold">通知设置</h2>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-bold">邮件通知</p><p className="text-xs text-muted-foreground">接收重要更新和账单通知</p></div>
            <ToggleSwitch checked={notifications.email} onChange={v => setNotifications(n => ({ ...n, email: v }))} />
          </div>
          <div className="border-t border-slate-50" />
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-bold">浏览器通知</p><p className="text-xs text-muted-foreground">在浏览器中接收实时通知</p></div>
            <ToggleSwitch checked={notifications.browser} onChange={v => setNotifications(n => ({ ...n, browser: v }))} />
          </div>
        </div>
      </div>
    </div>
  );
}
