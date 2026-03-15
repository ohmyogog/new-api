import { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-6 space-y-6">
      <h3 className="text-lg font-bold">{title}</h3>
      {children}
      <div className="flex justify-end pt-2">
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto"><Save className="size-4 mr-1.5" />保存</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-sm font-medium">{label}</Label>{children}</div>;
}

function SwitchField({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v:boolean)=>void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div><p className="text-sm font-medium">{label}</p>{desc && <p className="text-xs text-slate-400">{desc}</p>}</div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const [general, setGeneral] = useState({ name: 'New API', logo: '', home: '欢迎使用 New API', footer: '' });
  const [ops, setOps] = useState({ register: true, emailVerify: false, turnstile: false, inviteCode: false });
  const [billing, setBilling] = useState({ threshold: '1', groupRatio: '{"default":1,"vip":0.8}' });
  const [monitor, setMonitor] = useState({ testFreq: '60', autoDisable: true });
  const [other, setOther] = useState({ debug: false, logDays: '90' });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><SettingsIcon className="size-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold">系统设置</h1><p className="text-sm text-muted-foreground">配置系统参数</p></div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-100 rounded-2xl p-1">
          {[['general','通用设置'],['ops','运营设置'],['billing','计费设置'],['monitor','监控设置'],['other','其他设置']].map(([v,l])=>(
            <TabsTrigger key={v} value={v} className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">{l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <SectionCard title="基本信息">
            <Field label="系统名称"><Input value={general.name} onChange={e=>setGeneral({...general,name:e.target.value})} /></Field>
            <Field label="Logo URL"><Input value={general.logo} onChange={e=>setGeneral({...general,logo:e.target.value})} placeholder="https://..." /></Field>
            <Field label="首页内容"><Textarea value={general.home} onChange={e=>setGeneral({...general,home:e.target.value})} rows={4} /></Field>
            <Field label="页脚内容"><Input value={general.footer} onChange={e=>setGeneral({...general,footer:e.target.value})} /></Field>
          </SectionCard>
        </TabsContent>

        <TabsContent value="ops" className="space-y-6">
          <SectionCard title="注册与验证">
            <SwitchField label="开放注册" desc="允许新用户注册" checked={ops.register} onChange={v=>setOps({...ops,register:v})} />
            <SwitchField label="邮箱验证" desc="注册时需要验证邮箱" checked={ops.emailVerify} onChange={v=>setOps({...ops,emailVerify:v})} />
            <SwitchField label="Turnstile 验证" desc="启用 Cloudflare Turnstile" checked={ops.turnstile} onChange={v=>setOps({...ops,turnstile:v})} />
            <SwitchField label="邀请码" desc="注册时需要邀请码" checked={ops.inviteCode} onChange={v=>setOps({...ops,inviteCode:v})} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <SectionCard title="计费配置">
            <Field label="额度提醒阈值 ($)"><Input value={billing.threshold} onChange={e=>setBilling({...billing,threshold:e.target.value})} /></Field>
            <Field label="分组倍率配置 (JSON)"><Textarea value={billing.groupRatio} onChange={e=>setBilling({...billing,groupRatio:e.target.value})} rows={4} className="font-mono text-sm" /></Field>
          </SectionCard>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <SectionCard title="渠道监控">
            <Field label="测试频率 (秒)"><Input value={monitor.testFreq} onChange={e=>setMonitor({...monitor,testFreq:e.target.value})} /></Field>
            <SwitchField label="失败自动禁用" desc="渠道测试失败时自动禁用" checked={monitor.autoDisable} onChange={v=>setMonitor({...monitor,autoDisable:v})} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="other" className="space-y-6">
          <SectionCard title="其他">
            <SwitchField label="调试模式" desc="启用详细日志输出" checked={other.debug} onChange={v=>setOther({...other,debug:v})} />
            <Field label="日志保留天数"><Input value={other.logDays} onChange={e=>setOther({...other,logDays:e.target.value})} /></Field>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
