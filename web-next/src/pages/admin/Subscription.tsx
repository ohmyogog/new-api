import { useState } from 'react';
import { CreditCard, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface Plan { id: number; name: string; price: number; duration: number; status: 'active' | 'inactive'; subscribers: number; description: string; quota: number; }

const mockPlans: Plan[] = [
  { id: 1, name: '基础版', price: 9.9, duration: 30, status: 'active', subscribers: 128, description: '适合个人用户', quota: 500000 },
  { id: 2, name: '专业版', price: 49.9, duration: 30, status: 'active', subscribers: 56, description: '适合专业开发者', quota: 5000000 },
  { id: 3, name: '企业版', price: 199.9, duration: 30, status: 'active', subscribers: 12, description: '适合企业团队', quota: 50000000 },
  { id: 4, name: '年度特惠', price: 399.9, duration: 365, status: 'inactive', subscribers: 3, description: '年度订阅优惠', quota: 60000000 },
];

const emptyForm = { name: '', price: 0, duration: 30, status: 'active' as const, description: '', quota: 500000 };

export default function SubscriptionPage() {
  const [plans] = useState<Plan[]>(mockPlans);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = plans.filter(p => p.name.includes(search));
  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Plan) => { setEditId(p.id); setForm({ name: p.name, price: p.price, duration: p.duration, status: p.status, description: p.description, quota: p.quota }); setDialogOpen(true); };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><CreditCard className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">订阅管理</h1><p className="text-sm text-muted-foreground">管理订阅计划与定价</p></div>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto"><Plus className="size-4 mr-1.5" />创建计划</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="搜索计划名称..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11" />
      </div>

      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['计划名称','价格','时长(天)','状态','订阅人数','操作'].map(h=><th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(p=>(
            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
              <td className="px-6 py-4 font-medium">{p.name}</td>
              <td className="px-6 py-4">¥{p.price}</td>
              <td className="px-6 py-4">{p.duration}</td>
              <td className="px-6 py-4"><Badge className={p.status==='active'?'bg-emerald-50 text-emerald-600 border-emerald-200':'bg-slate-50 text-slate-500 border-slate-200'}>{p.status==='active'?'启用':'停用'}</Badge></td>
              <td className="px-6 py-4">{p.subscribers}</td>
              <td className="px-6 py-4 flex gap-1">
                <Button variant="ghost" size="icon" onClick={()=>openEdit(p)}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon"><Trash2 className="size-4 text-red-500" /></Button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{editId?'编辑计划':'创建计划'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium mb-1 block">计划名称</label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">价格 (¥)</label><Input type="number" value={form.price} onChange={e=>setForm({...form,price:+e.target.value})} /></div>
              <div><label className="text-sm font-medium mb-1 block">时长 (天)</label><Input type="number" value={form.duration} onChange={e=>setForm({...form,duration:+e.target.value})} /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">额度</label><Input type="number" value={form.quota} onChange={e=>setForm({...form,quota:+e.target.value})} /></div>
            <div><label className="text-sm font-medium mb-1 block">描述</label><Input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose><Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
