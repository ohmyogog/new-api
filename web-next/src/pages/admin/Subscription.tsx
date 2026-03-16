import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Plus, Search, Pencil, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  id: number;
  title: string;
  subtitle: string;
  price_amount: number;
  currency: string;
  duration_unit: string;
  duration_value: number;
  enabled: boolean;
  sort_order: number;
  total_amount: number;
  upgrade_group: string;
  max_purchase_per_user: number;
  quota_reset_period: string;
  created_at: number;
}

interface PlanDTO {
  plan: SubscriptionPlan;
}

const durationLabels: Record<string, string> = {
  day: '天', week: '周', month: '月', year: '年', custom: '自定义',
};

const emptyForm: Partial<SubscriptionPlan> = {
  title: '', subtitle: '', price_amount: 0, currency: 'USD',
  duration_unit: 'month', duration_value: 1, total_amount: 0,
  upgrade_group: '', max_purchase_per_user: 0, sort_order: 0,
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/subscription/admin/plans');
      if (res.data.success) {
        const items: SubscriptionPlan[] = (res.data.data || []).map((dto: PlanDTO) => dto.plan);
        setPlans(items);
      } else {
        toast.error(res.data.message || '加载失败');
      }
    } catch {
      toast.error('加载订阅计划失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const filtered = plans.filter(p => p.title.includes(search) || p.subtitle.includes(search));

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (p: SubscriptionPlan) => {
    setEditId(p.id);
    setForm({
      title: p.title, subtitle: p.subtitle, price_amount: p.price_amount,
      currency: p.currency, duration_unit: p.duration_unit, duration_value: p.duration_value,
      total_amount: p.total_amount, upgrade_group: p.upgrade_group,
      max_purchase_per_user: p.max_purchase_per_user, sort_order: p.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { toast.error('套餐标题不能为空'); return; }
    setSaving(true);
    try {
      const payload = { plan: form };
      const res = editId
        ? await API.put(`/api/subscription/admin/plans/${editId}`, payload)
        : await API.post('/api/subscription/admin/plans', payload);
      if (res.data.success) {
        toast.success(editId ? '更新成功' : '创建成功');
        setDialogOpen(false);
        fetchPlans();
      } else {
        toast.error(res.data.message || '保存失败');
      }
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p: SubscriptionPlan) => {
    try {
      const res = await API.patch(`/api/subscription/admin/plans/${p.id}`, { enabled: !p.enabled });
      if (res.data.success) {
        toast.success(p.enabled ? '已停用' : '已启用');
        fetchPlans();
      } else {
        toast.error(res.data.message || '操作失败');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const formatDuration = (p: SubscriptionPlan) => `${p.duration_value} ${durationLabels[p.duration_unit] || p.duration_unit}`;

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
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">暂无订阅计划</div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              {['计划名称','价格','时长','额度','状态','操作'].map(h => <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                <td className="px-6 py-4"><div className="font-medium">{p.title}</div>{p.subtitle && <div className="text-xs text-slate-400">{p.subtitle}</div>}</td>
                <td className="px-6 py-4">${p.price_amount}</td>
                <td className="px-6 py-4">{formatDuration(p)}</td>
                <td className="px-6 py-4 font-mono text-sm">{p.total_amount > 0 ? p.total_amount.toLocaleString() : '无限'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={p.enabled} onCheckedChange={() => toggleStatus(p)} />
                    <Badge className={p.enabled ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>{p.enabled ? '启用' : '停用'}</Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{editId ? '编辑计划' : '创建计划'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium mb-1 block">套餐标题</label><Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="text-sm font-medium mb-1 block">副标题</label><Input value={form.subtitle || ''} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">价格 (USD)</label><Input type="number" value={form.price_amount ?? 0} onChange={e => setForm({ ...form, price_amount: +e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-1 block">时长</label>
                <div className="flex gap-2">
                  <Input type="number" className="w-20" value={form.duration_value ?? 1} onChange={e => setForm({ ...form, duration_value: +e.target.value })} />
                  <select value={form.duration_unit || 'month'} onChange={e => setForm({ ...form, duration_unit: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm">
                    {Object.entries(durationLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">总额度</label><Input type="number" value={form.total_amount ?? 0} onChange={e => setForm({ ...form, total_amount: +e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-1 block">排序权重</label><Input type="number" value={form.sort_order ?? 0} onChange={e => setForm({ ...form, sort_order: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">升级分组</label><Input value={form.upgrade_group || ''} onChange={e => setForm({ ...form, upgrade_group: e.target.value })} placeholder="留空不变" /></div>
              <div><label className="text-sm font-medium mb-1 block">每人购买上限</label><Input type="number" value={form.max_purchase_per_user ?? 0} onChange={e => setForm({ ...form, max_purchase_per_user: +e.target.value })} placeholder="0=无限" /></div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">
              {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
