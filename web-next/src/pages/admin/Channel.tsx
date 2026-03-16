import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Radio, Plus, Search, Pencil, Trash2, Copy, Power, PlayCircle,
  ChevronLeft, ChevronRight, X, ChevronDown, Loader2,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

// ── Channel type definitions (from constant/channel.constants) ──
const CHANNEL_TYPES: { value: number; label: string }[] = [
  { value: 1, label: 'OpenAI' },
  { value: 2, label: 'Midjourney Proxy' },
  { value: 3, label: 'Azure OpenAI' },
  { value: 4, label: 'Ollama' },
  { value: 5, label: 'Midjourney Proxy Plus' },
  { value: 8, label: '自定义渠道' },
  { value: 11, label: 'Google PaLM2' },
  { value: 14, label: 'Anthropic Claude' },
  { value: 15, label: '百度文心千帆' },
  { value: 16, label: '智谱 ChatGLM' },
  { value: 17, label: '阿里通义千问' },
  { value: 18, label: '讯飞星火认知' },
  { value: 19, label: '360 智脑' },
  { value: 20, label: 'OpenRouter' },
  { value: 21, label: '知识库：AI Proxy' },
  { value: 22, label: '知识库：FastGPT' },
  { value: 23, label: '腾讯混元' },
  { value: 24, label: 'Google Gemini' },
  { value: 25, label: 'Moonshot' },
  { value: 26, label: '智谱 GLM-4V' },
  { value: 27, label: 'Perplexity' },
  { value: 31, label: '零一万物' },
  { value: 33, label: 'AWS Claude' },
  { value: 34, label: 'Cohere' },
  { value: 35, label: 'MiniMax' },
  { value: 36, label: 'Suno API' },
  { value: 37, label: 'Dify' },
  { value: 38, label: 'Jina' },
  { value: 39, label: 'Cloudflare' },
  { value: 40, label: 'SiliconCloud' },
  { value: 41, label: 'Vertex AI' },
  { value: 42, label: 'Mistral AI' },
  { value: 43, label: 'DeepSeek' },
  { value: 44, label: '嵌入模型：MokaAI M3E' },
  { value: 45, label: '字节火山方舟' },
  { value: 46, label: '百度文心千帆V2' },
  { value: 47, label: 'Xinference' },
  { value: 48, label: 'xAI' },
  { value: 49, label: 'Coze' },
  { value: 50, label: '可灵' },
  { value: 51, label: '即梦' },
  { value: 52, label: 'Vidu' },
  { value: 53, label: 'SubModel' },
  { value: 54, label: '豆包视频' },
  { value: 55, label: 'Sora' },
  { value: 56, label: 'Replicate' },
  { value: 57, label: 'Codex (OpenAI OAuth)' },
];
const typeMap = Object.fromEntries(CHANNEL_TYPES.map(t => [t.value, t.label]));

// ── Types ──
interface Channel {
  id: number;
  name: string;
  type: number;
  status: number;
  key: string;
  base_url: string;
  models: string;
  model_mapping: string;
  group: string;
  tag: string;
  priority: number;
  weight: number;
  balance: number;
  used_quota: number;
  response_time: number;
  test_time: number;
  created_time: number;
  remark?: string;
}

// ── Helpers ──
function statusBadge(status: number, responseTime: number) {
  if (status === 1) return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
      <span className="size-1.5 rounded-full bg-emerald-500" />已启用
      {responseTime > 0 && <span className="text-emerald-400 font-normal">{(responseTime / 1000).toFixed(2)}s</span>}
    </span>
  );
  if (status === 2) return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
      <span className="size-1.5 rounded-full bg-slate-400" />已禁用
    </span>
  );
  if (status === 3) return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600">
      <span className="size-1.5 rounded-full bg-amber-500" />自动禁用
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-500">
      <span className="size-1.5 rounded-full bg-red-500" />未知
    </span>
  );
}

function renderQuota(quota: number) {
  if (quota <= 0) return '$0.00';
  return '$' + (quota / 500000).toFixed(2);
}

const emptyForm = {
  name: '', type: 1, base_url: '', key: '', models: '',
  model_mapping: '', group: 'default', tag: '', priority: 0, weight: 0,
};

const PAGE_SIZE = 20;

// ── Component ──
export default function ChannelPage() {
  // Data state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Test state
  const [testingId, setTestingId] = useState<number | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Batch delete
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  // Debounce ref for search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── API calls ──
  const fetchChannels = useCallback(async (p: number, keyword?: string) => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'enabled' ? '&status=enabled' : statusFilter === 'disabled' ? '&status=disabled' : '';
      const typeParam = typeFilter !== 'all' ? `&type=${typeFilter}` : '';

      let res;
      if (keyword) {
        res = await API.get(`/api/channel/search?keyword=${encodeURIComponent(keyword)}&p=${p}&page_size=${PAGE_SIZE}${statusParam}${typeParam}`);
      } else {
        res = await API.get(`/api/channel/?p=${p}&page_size=${PAGE_SIZE}${statusParam}${typeParam}`);
      }

      const { success, message, data } = res.data;
      if (success) {
        const items = data?.items ?? data ?? [];
        setChannels(items);
        setTotal(data?.total ?? items.length);
      } else {
        toast.error(message || '获取渠道列表失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || '网络错误');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  // Initial load + reload on filter change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    fetchChannels(1, search || undefined);
  }, [statusFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSelected(new Set());
      fetchChannels(1, search || undefined);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelected(new Set());
    fetchChannels(newPage, search || undefined);
  };

  const refresh = () => {
    fetchChannels(page, search || undefined);
  };
  // ── Test channel ──
  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const res = await API.get(`/api/channel/test/${id}`);
      const { success, message, time } = res.data;
      if (success) {
        toast.success(`测试成功，耗时 ${time?.toFixed(2) ?? '?'}s`);
        // Update response_time in local state
        setChannels(prev => prev.map(c =>
          c.id === id ? { ...c, response_time: Math.round((time ?? 0) * 1000), test_time: Date.now() / 1000 } : c
        ));
      } else {
        toast.error(message || '测试失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '测试请求失败');
    } finally {
      setTestingId(null);
    }
  };

  // ── Toggle status ──
  const handleToggleStatus = async (channel: Channel) => {
    const newStatus = channel.status === 1 ? 2 : 1;
    try {
      const res = await API.put('/api/channel/', { id: channel.id, status: newStatus });
      if (res.data.success) {
        toast.success(newStatus === 1 ? '已启用' : '已禁用');
        setChannels(prev => prev.map(c =>
          c.id === channel.id ? { ...c, status: newStatus } : c
        ));
      } else {
        toast.error(res.data.message || '操作失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '操作失败');
    }
  };

  // ── Delete channel ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await API.delete(`/api/channel/${deleteTarget.id}/`);
      if (res.data.success) {
        toast.success('渠道已删除');
        setDeleteTarget(null);
        refresh();
      } else {
        toast.error(res.data.message || '删除失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // ── Copy channel ──
  const handleCopy = async (id: number) => {
    try {
      const res = await API.post(`/api/channel/copy/${id}`);
      if (res.data.success) {
        toast.success('渠道已复制');
        refresh();
      } else {
        toast.error(res.data.message || '复制失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '复制失败');
    }
  };

  // ── Batch delete ──
  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    setBatchDeleting(true);
    try {
      const res = await API.post('/api/channel/batch', { ids: Array.from(selected) });
      if (res.data.success) {
        toast.success(`已删除 ${res.data.data ?? selected.size} 个渠道`);
        setSelected(new Set());
        setBatchDeleteOpen(false);
        refresh();
      } else {
        toast.error(res.data.message || '批量删除失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '批量删除失败');
    } finally {
      setBatchDeleting(false);
    }
  };

  // ── Batch enable/disable by selected ──
  const handleBatchToggle = async (enable: boolean) => {
    const ids = Array.from(selected);
    let successCount = 0;
    for (const id of ids) {
      try {
        const res = await API.put('/api/channel/', { id, status: enable ? 1 : 2 });
        if (res.data.success) successCount++;
      } catch { /* skip */ }
    }
    toast.success(`已${enable ? '启用' : '禁用'} ${successCount} 个渠道`);
    setSelected(new Set());
    refresh();
  };

  // ── Save (create/edit) ──
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('请输入渠道名称'); return; }
    if (!form.key.trim() && !editId) { toast.error('请输入 API Key'); return; }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        type: form.type,
        key: form.key,
        base_url: form.base_url,
        models: form.models,
        model_mapping: form.model_mapping || '',
        group: form.group || 'default',
        tag: form.tag || '',
        priority: form.priority,
        weight: form.weight,
      };

      let res;
      if (editId) {
        payload.id = editId;
        res = await API.put('/api/channel/', payload);
      } else {
        res = await API.post('/api/channel/', payload);
      }

      if (res.data.success) {
        toast.success(editId ? '渠道已更新' : '渠道已创建');
        setDialogOpen(false);
        refresh();
      } else {
        toast.error(res.data.message || '保存失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ── Open edit dialog (fetch full channel with key) ──
  const openEdit = async (c: Channel) => {
    try {
      const res = await API.get(`/api/channel/${c.id}`);
      if (res.data.success) {
        const ch = res.data.data;
        setEditId(ch.id);
        setForm({
          name: ch.name || '',
          type: ch.type,
          base_url: ch.base_url || '',
          key: ch.key || '',
          models: ch.models || '',
          model_mapping: ch.model_mapping || '',
          group: ch.group || 'default',
          tag: ch.tag || '',
          priority: ch.priority ?? 0,
          weight: ch.weight ?? 0,
        });
        setDialogOpen(true);
      } else {
        toast.error(res.data.message || '获取渠道详情失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '获取渠道详情失败');
    }
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  // ── Selection helpers ──
  const allSelected = channels.length > 0 && channels.every(c => selected.has(c.id));
  const toggleSelect = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(channels.map(c => c.id)));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Radio className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">渠道管理</h1><p className="text-sm text-muted-foreground">管理上游 AI 服务渠道</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} className="rounded-2xl h-auto px-4 py-2.5" disabled={loading}>
            <RefreshCw className={`size-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />刷新
          </Button>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto">
            <Plus className="size-4 mr-1.5" />添加渠道
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索渠道名称..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11" />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-2xl p-1">
          {([['all', '全部'], ['enabled', '已启用'], ['disabled', '已禁用']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === v ? 'bg-white text-foreground shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
          ))}
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pr-9 text-xs font-bold text-slate-600 focus:ring-4 focus:ring-primary/5 focus:border-primary cursor-pointer">
            <option value="all">所有类型</option>
            {CHANNEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-2xl px-5 py-3">
          <span className="text-sm font-medium text-primary">已选 {selected.size} 项</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => handleBatchToggle(true)}><Power className="size-3.5 mr-1" />批量启用</Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => handleBatchToggle(false)}><X className="size-3.5 mr-1" />批量禁用</Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setBatchDeleteOpen(true)}><Trash2 className="size-3.5 mr-1" />批量删除</Button>
            <button onClick={() => setSelected(new Set())} className="size-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 inline-flex items-center justify-center"><X className="size-4" /></button>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        {loading && channels.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Radio className="size-10 mb-3 opacity-30" />
            <p className="text-sm">暂无渠道数据</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-4 py-4 w-10"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 rounded accent-primary" /></th>
            {['ID','名称','类型','状态','已用/余额','优先级','权重','操作'].map(h => (
              <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {channels.map(c => (
              <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${selected.has(c.id) ? 'bg-primary/[0.02]' : ''}`}>
                <td className="px-4 py-4"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="size-4 rounded accent-primary" /></td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{c.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    {c.tag && <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">{c.tag}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{typeMap[c.type] || `Type ${c.type}`}</td>
                <td className="px-6 py-4">{statusBadge(c.status, c.response_time)}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                  <span title="已用额度">{renderQuota(c.used_quota)}</span>
                  <span className="mx-1 text-slate-300">/</span>
                  <span title="余额">{c.balance > 0 ? `$${c.balance.toFixed(2)}` : '-'}</span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{c.priority ?? 0}</td>
                <td className="px-6 py-4 text-sm font-medium">{c.weight ?? 0}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleTest(c.id)} disabled={testingId === c.id} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center disabled:opacity-50" title="测试">
                      {testingId === c.id ? <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <PlayCircle className="size-4" />}
                    </button>
                    <button onClick={() => openEdit(c)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title="编辑"><Pencil className="size-4" /></button>
                    <button onClick={() => handleCopy(c.id)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title="复制"><Copy className="size-4" /></button>
                    <button onClick={() => handleToggleStatus(c)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title={c.status === 1 ? '禁用' : '启用'}>
                      <Power className={`size-4 ${c.status === 1 ? '' : 'text-emerald-500'}`} />
                    </button>
                    <button onClick={() => setDeleteTarget(c)} className="size-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all inline-flex items-center justify-center" title="删除"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {total} 条渠道</p>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editId ? '编辑渠道' : '添加渠道'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Type */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">渠道类型</label>
              <div className="relative">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: Number(e.target.value) }))}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary">
                  {CHANNEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            {/* Name */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">渠道名称</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例如：OpenAI 主力渠道" />
            </div>
            {/* Base URL */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Base URL <span className="text-slate-400 font-normal">(可选)</span></label>
              <Input value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} placeholder="https://api.openai.com" />
            </div>
            {/* Key */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">API Key</label>
              <textarea value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                placeholder="支持多个 Key，每行一个" rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary resize-none outline-none" />
            </div>
            {/* Models */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">模型</label>
              <textarea value={form.models} onChange={e => setForm(f => ({ ...f, models: e.target.value }))}
                placeholder="逗号分隔，例如：gpt-4o,gpt-4o-mini,o1-pro" rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary resize-none outline-none" />
            </div>
            {/* Model Mapping */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">模型映射 <span className="text-slate-400 font-normal">(JSON, 可选)</span></label>
              <textarea value={form.model_mapping} onChange={e => setForm(f => ({ ...f, model_mapping: e.target.value }))}
                placeholder='{"gpt-3.5-turbo": "gpt-3.5-turbo-0125"}' rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-mono focus:ring-4 focus:ring-primary/5 focus:border-primary resize-none outline-none" />
            </div>
            {/* Group & Tag */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">分组</label>
                <Input value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} placeholder="default" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">标签</label>
                <Input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="可选" />
              </div>
            </div>
            {/* Priority & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">优先级</label>
                <Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">权重</label>
                <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
              {saving && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              {editId ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            确定要删除渠道 <span className="font-medium text-foreground">{deleteTarget?.name}</span> (ID: {deleteTarget?.id}) 吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold">
              {deleting && <Loader2 className="size-4 mr-1.5 animate-spin" />}删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">批量删除确认</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            确定要删除选中的 <span className="font-medium text-foreground">{selected.size}</span> 个渠道吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleBatchDelete} disabled={batchDeleting} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold">
              {batchDeleting && <Loader2 className="size-4 mr-1.5 animate-spin" />}确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
