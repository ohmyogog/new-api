import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Search, Trash2, Copy, Check, ChevronLeft, ChevronRight, Power, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

interface Redemption {
  id: number;
  user_id: number;
  key: string;
  status: number; // 1=enabled, 2=disabled, 3=used
  name: string;
  quota: number;
  created_time: number;
  redeemed_time: number;
  count: number;
  used_user_id: number;
  expired_time: number;
}

interface PageData {
  page: number;
  page_size: number;
  total: number;
  items: Redemption[] | null;
}

const statusStyles: Record<number, string> = {
  1: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  2: 'bg-red-50 text-red-500 border-red-200',
  3: 'bg-slate-50 text-slate-500 border-slate-200',
};
const statusLabels: Record<number, string> = { 1: '未使用', 2: '已禁用', 3: '已使用' };

const fmtQuota = (q: number) => `$${(q / 500000).toFixed(2)}`;
const fmtTime = (ts: number) => ts ? new Date(ts * 1000).toLocaleString() : '-';

export default function RedemptionPage() {
  const [codes, setCodes] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Redemption | null>(null);
  const [formName, setFormName] = useState('');
  const [formQuota, setFormQuota] = useState(100000);
  const [formCount, setFormCount] = useState(10);
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Redemption | null>(null);

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/redemption/search?keyword=${encodeURIComponent(search)}&p=${page}&page_size=${pageSize}`
        : `/api/redemption/?p=${page}&page_size=${pageSize}`;
      const res = await API.get(url);
      const d = res.data as { success: boolean; message: string; data: PageData };
      if (d.success) {
        setCodes(d.data.items ?? []);
        setTotal(d.data.total);
      } else {
        toast.error(d.message || '加载失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditItem(null); setFormName(''); setFormQuota(100000); setFormCount(10); setDialogOpen(true); };
  const openEdit = (r: Redemption) => { setEditItem(r); setFormName(r.name); setFormQuota(r.quota); setFormCount(1); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) {
        const res = await API.put('/api/redemption/', { id: editItem.id, name: formName, quota: formQuota, status: editItem.status });
        const d = res.data as { success: boolean; message: string };
        if (!d.success) { toast.error(d.message || '更新失败'); return; }
        toast.success('更新成功');
      } else {
        const res = await API.post('/api/redemption/', { name: formName, quota: formQuota, count: formCount });
        const d = res.data as { success: boolean; message: string; data: string[] };
        if (!d.success) { toast.error(d.message || '创建失败'); return; }
        toast.success(`成功创建 ${d.data?.length ?? 0} 个兑换码`);
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error('操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (r: Redemption) => {
    const newStatus = r.status === 1 ? 2 : 1;
    try {
      const res = await API.put('/api/redemption/?status_only=true', { id: r.id, status: newStatus });
      const d = res.data as { success: boolean; message: string };
      if (d.success) { toast.success(newStatus === 1 ? '已启用' : '已禁用'); fetchData(); }
      else toast.error(d.message || '操作失败');
    } catch { toast.error('操作失败'); }
  };

  const confirmDelete = (r: Redemption) => { setDeleteTarget(r); setDeleteDialogOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await API.delete(`/api/redemption/${deleteTarget.id}`);
      const d = res.data as { success: boolean; message: string };
      if (d.success) { toast.success('删除成功'); fetchData(); }
      else toast.error(d.message || '删除失败');
    } catch { toast.error('删除失败'); }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteInvalid = async () => {
    try {
      const res = await API.delete('/api/redemption/invalid');
      const d = res.data as { success: boolean; message: string; data: number };
      if (d.success) { toast.success(`已清理 ${d.data ?? 0} 条无效兑换码`); fetchData(); }
      else toast.error(d.message || '清理失败');
    } catch { toast.error('清理失败'); }
  };

  const handleCopy = (r: Redemption) => {
    navigator.clipboard.writeText(r.key).then(() => {
      setCopiedId(r.id);
      toast.success('已复制');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Ticket className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">兑换码管理</h1><p className="text-sm text-muted-foreground">创建和管理兑换码</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDeleteInvalid} className="rounded-2xl font-bold px-5 py-2.5 h-auto text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="size-4 mr-1.5" />清理无效
          </Button>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto">
            <Plus className="size-4 mr-1.5" />批量创建
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="搜索名称或 ID..." value={search} onChange={e => handleSearch(e.target.value)} className="pl-11" />
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['ID', '名称', '兑换码', '额度', '状态', '使用者', '创建时间', '操作'].map(h =>
              <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>
            )}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">加载中...</td></tr>
            ) : codes.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">暂无数据</td></tr>
            ) : codes.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-muted-foreground">{c.id}</td>
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-6 py-4 font-mono text-sm">{c.key}</td>
                <td className="px-6 py-4">{fmtQuota(c.quota)}</td>
                <td className="px-6 py-4"><Badge className={statusStyles[c.status] || statusStyles[1]}>{statusLabels[c.status] || '未知'}</Badge></td>
                <td className="px-6 py-4 text-sm">{c.used_user_id ? c.used_user_id : '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{fmtTime(c.created_time)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCopy(c)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title="复制">
                      {copiedId === c.id ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                    </button>
                    <button onClick={() => openEdit(c)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title="编辑">
                      <Pencil className="size-4" />
                    </button>
                    {c.status !== 3 && (
                      <button onClick={() => handleToggleStatus(c)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title={c.status === 1 ? '禁用' : '启用'}>
                        <Power className={`size-4 ${c.status === 1 ? '' : 'text-emerald-500'}`} />
                      </button>
                    )}
                    <button onClick={() => confirmDelete(c)} className="size-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all inline-flex items-center justify-center" title="删除">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {total} 条兑换码</p>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>{editItem ? '编辑兑换码' : '批量创建兑换码'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">名称</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="兑换码名称（最多20字）" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">每张额度</label>
              <Input type="number" value={formQuota} onChange={e => setFormQuota(+e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">当前: {fmtQuota(formQuota)}</p>
            </div>
            {!editItem && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">生成数量</label>
                <Input type="number" value={formCount} onChange={e => setFormCount(+e.target.value)} min={1} max={100} />
                <p className="text-xs text-slate-400 mt-1">最多 100 个</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">
              {saving ? '处理中...' : editItem ? '保存' : '生成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">确定要删除兑换码 <span className="font-mono font-medium text-foreground">{deleteTarget?.key}</span> 吗？此操作不可撤销。</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold">删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
