import { useState } from 'react';
import { Server, Plus, Search, Pencil, Trash2, Play, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface Deployment { id: number; name: string; model: string; hardware: string; status: 'running'|'stopped'|'pending'; region: string; cost: number; createdAt: string; }

const mockDeployments: Deployment[] = [
  { id: 1, name: 'prod-gpt4o', model: 'gpt-4o', hardware: 'A100 80GB', status: 'running', region: 'us-east-1', cost: 3.2, createdAt: '2025-12-01' },
  { id: 2, name: 'prod-claude', model: 'claude-3.5-sonnet', hardware: 'H100 80GB', status: 'running', region: 'us-west-2', cost: 4.8, createdAt: '2025-12-15' },
  { id: 3, name: 'staging-gemini', model: 'gemini-pro', hardware: 'A10G', status: 'stopped', region: 'ap-northeast-1', cost: 0, createdAt: '2026-01-10' },
  { id: 4, name: 'dev-embed', model: 'text-embedding-3-large', hardware: 'T4', status: 'pending', region: 'eu-west-1', cost: 0.5, createdAt: '2026-03-01' },
];

const statusStyles: Record<string,string> = { running: 'bg-emerald-50 text-emerald-600 border-emerald-200', stopped: 'bg-slate-50 text-slate-500 border-slate-200', pending: 'bg-amber-50 text-amber-600 border-amber-200' };
const statusLabels: Record<string,string> = { running: '运行中', stopped: '已停止', pending: '部署中' };
const emptyForm = { name: '', model: '', hardware: 'A100 80GB', region: 'us-east-1' };

export default function DeploymentPage() {
  const [deployments] = useState<Deployment[]>(mockDeployments);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = deployments.filter(d => d.name.includes(search) || d.model.includes(search));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Server className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">模型部署</h1><p className="text-sm text-muted-foreground">管理模型部署实例</p></div>
        </div>
        <Button onClick={()=>{setForm(emptyForm);setDialogOpen(true);}} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto"><Plus className="size-4 mr-1.5" />创建部署</Button>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="搜索部署..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-11" /></div>

      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['部署名称','模型','硬件','状态','区域','费用($/h)','创建时间','操作'].map(h=><th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(d=>(
            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
              <td className="px-6 py-4 font-medium">{d.name}</td>
              <td className="px-6 py-4 font-mono text-sm">{d.model}</td>
              <td className="px-6 py-4">{d.hardware}</td>
              <td className="px-6 py-4"><Badge className={statusStyles[d.status]}>{statusLabels[d.status]}</Badge></td>
              <td className="px-6 py-4">{d.region}</td>
              <td className="px-6 py-4">${d.cost}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{d.createdAt}</td>
              <td className="px-6 py-4 flex gap-1">
                {d.status==='running'?<Button variant="ghost" size="icon"><Square className="size-4 text-amber-500" /></Button>:<Button variant="ghost" size="icon"><Play className="size-4 text-emerald-500" /></Button>}
                <Button variant="ghost" size="icon"><Trash2 className="size-4 text-red-500" /></Button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>创建部署</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium mb-1 block">部署名称</label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="text-sm font-medium mb-1 block">模型</label><Input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">硬件类型</label>
                <select value={form.hardware} onChange={e=>setForm({...form,hardware:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm">
                  {['T4','A10G','A100 40GB','A100 80GB','H100 80GB'].map(h=><option key={h} value={h}>{h}</option>)}
                </select></div>
              <div><label className="text-sm font-medium mb-1 block">区域</label>
                <select value={form.region} onChange={e=>setForm({...form,region:e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm">
                  {['us-east-1','us-west-2','eu-west-1','ap-northeast-1'].map(r=><option key={r} value={r}>{r}</option>)}
                </select></div>
            </div>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose><Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
