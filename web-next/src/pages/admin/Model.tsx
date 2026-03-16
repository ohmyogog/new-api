import { useState, useEffect, useCallback } from 'react';
import { Box, Plus, Search, Pencil, Trash2, RefreshCw, ChevronLeft, ChevronRight, Power, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

interface ModelItem {
  id: number;
  model_name: string;
  description: string;
  icon: string;
  tags: string;
  vendor_id: number;
  endpoints: string;
  status: number; // 1=enabled, 0=disabled
  sync_official: number;
  created_time: number;
  updated_time: number;
  bound_channels?: { name: string; type: number }[];
  enable_groups?: string[];
  quota_types?: number[];
  name_rule: number;
  matched_models?: string[];
  matched_count?: number;
}

interface Vendor {
  id: number;
  name: string;
  description: string;
  icon: string;
  status: number;
}

interface PageData {
  page: number;
  page_size: number;
  total: number;
  items: ModelItem[] | null;
}

const nameRuleLabels: Record<number, string> = { 0: '精确', 1: '前缀', 2: '包含', 3: '后缀' };
const nameRuleStyles: Record<number, string> = {
  0: 'bg-blue-50 text-blue-600 border-blue-200',
  1: 'bg-purple-50 text-purple-600 border-purple-200',
  2: 'bg-amber-50 text-amber-600 border-amber-200',
  3: 'bg-teal-50 text-teal-600 border-teal-200',
};
const fmtTime = (ts: number) => ts ? new Date(ts * 1000).toLocaleString() : '-';

const emptyForm = {
  model_name: '',
  description: '',
  icon: '',
  tags: '',
  vendor_id: 0,
  status: 1,
  sync_official: 1,
  name_rule: 0,
  endpoints: '',
};

export default function ModelPage() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ModelItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ModelItem | null>(null);

  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.name]));

  // Fetch vendors once
  useEffect(() => {
    API.get('/api/vendors/?page_size=1000').then(res => {
      const d = res.data as { success: boolean; data: PageData & { items: Vendor[] | null } };
      if (d.success && d.data?.items) setVendors(d.data.items);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/models/search?keyword=${encodeURIComponent(search)}&p=${page}&page_size=${pageSize}`
        : `/api/models/?p=${page}&page_size=${pageSize}`;
      const res = await API.get(url);
      const d = res.data as { success: boolean; message: string; data: PageData | { items: ModelItem[] | null; total: number } };
      if (d.success) {
        const data = d.data as any;
        setModels(data.items ?? []);
        setTotal(data.total ?? 0);
      } else {
        toast.error((d as any).message || '加载失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: ModelItem) => {
    setEditItem(m);
    setForm({
      model_name: m.model_name,
      description: m.description || '',
      icon: m.icon || '',
      tags: m.tags || '',
      vendor_id: m.vendor_id,
      status: m.status,
      sync_official: m.sync_official,
      name_rule: m.name_rule,
      endpoints: m.endpoints || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = editItem
        ? { id: editItem.id, ...form }
        : form;
      const res = editItem
        ? await API.put('/api/models/', body)
        : await API.post('/api/models/', body);
      const d = res.data as { success: boolean; message: string };
      if (!d.success) { toast.error(d.message || '操作失败'); return; }
      toast.success(editItem ? '更新成功' : '创建成功');
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error('操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (m: ModelItem) => {
    const newStatus = m.status === 1 ? 0 : 1;
    try {
      const res = await API.put('/api/models/?status_only=true', { id: m.id, status: newStatus });
      const d = res.data as { success: boolean; message: string };
      if (d.success) { toast.success(newStatus === 1 ? '已启用' : '已停用'); fetchData(); }
      else toast.error(d.message || '操作失败');
    } catch { toast.error('操作失败'); }
  };

  const confirmDelete = (m: ModelItem) => { setDeleteTarget(m); setDeleteDialogOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await API.delete(`/api/models/${deleteTarget.id}`);
      const d = res.data as { success: boolean; message: string };
      if (d.success) { toast.success('删除成功'); fetchData(); }
      else toast.error(d.message || '删除失败');
    } catch { toast.error('删除失败'); }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Box className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">模型管理</h1><p className="text-sm text-muted-foreground">管理可用模型与定价</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} className="rounded-2xl font-bold px-5 py-2.5 h-auto">
            <RefreshCw className="size-4 mr-1.5" />刷新
          </Button>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto">
            <Plus className="size-4 mr-1.5" />添加模型
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="搜索模型名称、描述、标签..." value={search} onChange={e => handleSearch(e.target.value)} className="pl-11" />
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['ID', '模型名称', '供应商', '匹配规则', '标签', '状态', '渠道数', '创建时间', '操作'].map(h =>
              <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>
            )}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">加载中...</td></tr>
            ) : models.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">暂无数据</td></tr>
            ) : models.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-muted-foreground">{m.id}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm font-medium">{m.model_name}</span>
                    {m.description && <span className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{m.description}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{vendorMap[m.vendor_id] || (m.vendor_id ? `#${m.vendor_id}` : '-')}</td>
                <td className="px-6 py-4">
                  <Badge className={nameRuleStyles[m.name_rule] || nameRuleStyles[0]}>{nameRuleLabels[m.name_rule] || '精确'}</Badge>
                  {m.matched_count ? <span className="text-xs text-slate-400 ml-1.5">({m.matched_count})</span> : null}
                </td>
                <td className="px-6 py-4">
                  {m.tags ? m.tags.split(',').filter(Boolean).map(tag => (
                    <span key={tag} className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 mr-1">{tag.trim()}</span>
                  )) : '-'}
                </td>
                <td className="px-6 py-4">
                  <Badge className={m.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>
                    {m.status === 1 ? '启用' : '停用'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm">{m.bound_channels?.length ?? 0}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{fmtTime(m.created_time)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(m)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title="编辑"><Pencil className="size-4" /></button>
                    <button onClick={() => handleToggleStatus(m)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title={m.status === 1 ? '停用' : '启用'}>
                      <Power className={`size-4 ${m.status === 1 ? '' : 'text-emerald-500'}`} />
                    </button>
                    <button onClick={() => confirmDelete(m)} className="size-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all inline-flex items-center justify-center" title="删除"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {total} 个模型</p>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-lg font-bold">{editItem ? '编辑模型' : '添加模型'}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">模型名称</label>
              <Input value={form.model_name} onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))} placeholder="例如：gpt-4o" disabled={!!editItem} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">描述</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="模型描述（可选）" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">供应商</label>
                <div className="relative">
                  <select value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: Number(e.target.value) }))}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary">
                    <option value={0}>无</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">匹配规则</label>
                <div className="relative">
                  <select value={form.name_rule} onChange={e => setForm(f => ({ ...f, name_rule: Number(e.target.value) }))}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary">
                    <option value={0}>精确匹配</option>
                    <option value={1}>前缀匹配</option>
                    <option value={2}>包含匹配</option>
                    <option value={3}>后缀匹配</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">标签 <span className="text-slate-400 font-normal">(逗号分隔)</span></label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="chat,vision" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">图标 URL <span className="text-slate-400 font-normal">(可选)</span></label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
              {saving ? '处理中...' : editItem ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">确定要删除模型 <span className="font-mono font-medium text-foreground">{deleteTarget?.model_name}</span> 吗？此操作不可撤销。</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold">删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
