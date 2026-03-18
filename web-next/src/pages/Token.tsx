import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Key, Plus, Search, Copy, Check, Trash2, Eye, EyeOff,
  ChevronLeft, ChevronRight, ChevronDown, Loader2, AlertTriangle,
  Globe, Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

// ── Types ──
interface Token {
  id: number;
  name: string;
  status: number;
  key: string;
  used_quota: number;
  remain_quota: number;
  created_time: number;
  expired_time: number;
  unlimited_quota: boolean;
  model_limits_enabled: boolean;
  model_limits: string;
  allow_ips: string | null;
  group: string;
  cross_group_retry?: boolean;
}

interface TokenForm {
  name: string;
  remain_quota: number;
  unlimited_quota: boolean;
  expired_time: number;
  model_limits_enabled: boolean;
  model_limits: string;
  allow_ips: string;
  group: string;
}

// ── Helpers ──
function fmtQuota(q: number) {
  if (q === -1) return '无限';
  return `$${(q / 500000).toFixed(2)}`;
}
function fmtTime(t: number) {
  if (t <= 0 || t === -1) return '永不过期';
  return new Date(t * 1000).toLocaleString('zh-CN');
}
function maskKey(key: string) {
  if (!key) return '';
  if (key.length <= 8) return `sk-${key}`;
  return `sk-${key.slice(0, 4)}...${key.slice(-4)}`;
}
const emptyForm: TokenForm = {
  name: '', remain_quota: 500000, unlimited_quota: true,
  expired_time: -1, model_limits_enabled: false, model_limits: '',
  allow_ips: '', group: '',
};

export default function TokenPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchToken, setSearchToken] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TokenForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single'; id: number } | { type: 'batch' } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // Key visibility & resolved keys
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
  const [resolvedKeys, setResolvedKeys] = useState<Record<number, string>>({});
  const [loadingKeys, setLoadingKeys] = useState<Record<number, boolean>>({});
  const keyRequests = useRef<Record<number, Promise<string>>>({});

  // Chat links from localStorage
  const chatsArray = (() => {
    try {
      const raw = localStorage.getItem('chats');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  // ── Fetch tokens ──
  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { p: page, page_size: pageSize };
      let url = '/api/token/';
      if (searchKeyword || searchToken) {
        url = '/api/token/search';
        if (searchKeyword) params.keyword = searchKeyword;
        if (searchToken) params.token = searchToken;
      }
      const res = await API.get(url, { params });
      if (res.data.success) {
        const d = res.data.data;
        setTokens(d.items || d || []);
        setTotal(d.total || (Array.isArray(d) ? d.length : 0));
        setVisibleKeys({});
      } else {
        toast.error(res.data.message || '获取令牌列表失败');
      }
    } catch {
      toast.error('获取令牌列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchKeyword, searchToken]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  // ── Fetch token full key (with dedup) ──
  const fetchTokenKey = async (tokenId: number): Promise<string> => {
    if (resolvedKeys[tokenId]) return resolvedKeys[tokenId];
    if (tokenId in keyRequests.current) return await keyRequests.current[tokenId];
    const req = (async () => {
      setLoadingKeys(prev => ({ ...prev, [tokenId]: true }));
      try {
        const res = await API.post(`/api/token/${tokenId}/key`);
        const fullKey = res.data?.data || '';
        setResolvedKeys(prev => ({ ...prev, [tokenId]: fullKey }));
        return fullKey;
      } finally {
        delete keyRequests.current[tokenId];
        setLoadingKeys(prev => { const n = { ...prev }; delete n[tokenId]; return n; });
      }
    })();
    keyRequests.current[tokenId] = req;
    return req;
  };

  const toggleKeyVisibility = async (t: Token) => {
    if (visibleKeys[t.id]) {
      setVisibleKeys(prev => ({ ...prev, [t.id]: false }));
      return;
    }
    try {
      await fetchTokenKey(t.id);
      setVisibleKeys(prev => ({ ...prev, [t.id]: true }));
    } catch { toast.error('获取密钥失败'); }
  };

  const copyTokenKey = async (t: Token) => {
    try {
      let key = resolvedKeys[t.id];
      if (!key) key = await fetchTokenKey(t.id);
      await navigator.clipboard.writeText(`sk-${key}`);
      setCopiedId(t.id);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopiedId(null), 2000);
    } catch { toast.error('复制失败'); }
  };

  // ── Fetch models & groups for form ──
  const fetchFormOptions = async () => {
    try {
      const [modelsRes, groupsRes] = await Promise.all([
        API.get('/api/user/models'),
        API.get('/api/user/self/groups'),
      ]);
      if (modelsRes.data.success) setAvailableModels(modelsRes.data.data || []);
      if (groupsRes.data.success) {
        const g = groupsRes.data.data;
        setAvailableGroups(typeof g === 'object' && !Array.isArray(g) ? Object.keys(g) : Array.isArray(g) ? g : []);
      }
    } catch { /* ignore */ }
  };

  // ── Selection ──
  const allSelected = tokens.length > 0 && tokens.every(t => selectedIds.has(t.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(tokens.map(t => t.id)));
  };
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Create / Edit ──
  const openCreate = () => {
    setEditId(null); setForm(emptyForm); fetchFormOptions(); setDialogOpen(true);
  };
  const openEdit = (t: Token) => {
    setEditId(t.id);
    setForm({
      name: t.name, remain_quota: t.remain_quota, unlimited_quota: t.unlimited_quota,
      expired_time: t.expired_time, model_limits_enabled: t.model_limits_enabled,
      model_limits: t.model_limits || '', allow_ips: t.allow_ips || '', group: t.group || '',
    });
    fetchFormOptions(); setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('请输入令牌名称'); return; }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name, remain_quota: form.remain_quota, unlimited_quota: form.unlimited_quota,
        expired_time: form.expired_time, model_limits_enabled: form.model_limits_enabled,
        model_limits: form.model_limits, allow_ips: form.allow_ips, group: form.group,
      };
      const res = editId
        ? await API.put('/api/token/', { ...payload, id: editId, status: tokens.find(t => t.id === editId)?.status ?? 1 })
        : await API.post('/api/token/', payload);
      if (res.data.success) { toast.success(editId ? '令牌已更新' : '令牌已创建'); setDialogOpen(false); fetchTokens(); }
      else toast.error(res.data.message || '操作失败');
    } catch { toast.error('操作失败'); }
    finally { setSubmitting(false); }
  };

  // ── Toggle status ──
  const handleToggle = async (t: Token) => {
    const newStatus = t.status === 1 ? 2 : 1;
    try {
      const res = await API.put('/api/token/?status_only=true', { id: t.id, status: newStatus });
      if (res.data.success) { toast.success(newStatus === 1 ? '已启用' : '已禁用'); fetchTokens(); }
      else toast.error(res.data.message || '操作失败');
    } catch { toast.error('操作失败'); }
  };

  // ── Delete (single or batch) ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'single') {
        const res = await API.delete(`/api/token/${deleteTarget.id}`);
        if (res.data.success) { toast.success('令牌已删除'); fetchTokens(); }
        else toast.error(res.data.message || '删除失败');
      } else {
        const ids = Array.from(selectedIds);
        const res = await API.post('/api/token/batch', { ids });
        if (res.data.success) { toast.success(`已删除 ${res.data.data || ids.length} 个令牌`); setSelectedIds(new Set()); fetchTokens(); }
        else toast.error(res.data.message || '批量删除失败');
      }
    } catch { toast.error('删除失败'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  // ── Batch copy ──
  const handleBatchCopy = async (withName: boolean) => {
    if (selectedIds.size === 0) { toast.error('请先选择令牌'); return; }
    try {
      const selected = tokens.filter(t => selectedIds.has(t.id));
      const keys = await Promise.all(selected.map(t => fetchTokenKey(t.id)));
      const content = selected.map((t, i) =>
        withName ? `${t.name}    sk-${keys[i]}` : `sk-${keys[i]}`
      ).join('\n');
      await navigator.clipboard.writeText(content);
      toast.success(`已复制 ${selected.length} 个令牌`);
    } catch { toast.error('复制失败'); }
  };

  // ── Chat link ──
  const openChatLink = async (t: Token) => {
    if (chatsArray.length === 0) { toast.error('请联系管理员配置聊天链接'); return; }
    const first = chatsArray[0];
    const name = Object.keys(first)[0];
    let url: string = first[name];
    const fullKey = await fetchTokenKey(t.id);
    let serverAddress = '';
    try { serverAddress = JSON.parse(localStorage.getItem('status') || '{}').server_address || ''; } catch {}
    if (!serverAddress) serverAddress = window.location.origin;
    url = url.replaceAll('{address}', encodeURIComponent(serverAddress));
    url = url.replaceAll('{key}', `sk-${fullKey}`);
    window.open(url, '_blank');
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Key className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">令牌管理</h1><p className="text-sm text-muted-foreground">管理你的 API 令牌</p></div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button variant="outline" className="rounded-2xl text-sm" onClick={() => handleBatchCopy(false)}>
                <Copy className="size-3.5 mr-1.5" />复制密钥 ({selectedIds.size})
              </Button>
              <Button variant="outline" className="rounded-2xl text-sm" onClick={() => handleBatchCopy(true)}>
                <Copy className="size-3.5 mr-1.5" />复制名称+密钥
              </Button>
              <Button variant="outline" className="rounded-2xl text-sm text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget({ type: 'batch' })}>
                <Trash2 className="size-3.5 mr-1.5" />删除 ({selectedIds.size})
              </Button>
            </>
          )}
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto">
            <Plus className="size-4 mr-1.5" />创建令牌
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索令牌名称..." value={searchKeyword} onChange={e => { setSearchKeyword(e.target.value); setPage(1); }} className="pl-11" />
        </div>
        <div className="relative flex-1">
          <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索令牌密钥..." value={searchToken} onChange={e => { setSearchToken(e.target.value); setPage(1); }} className="pl-11" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border border-slate-100 rounded-3xl soft-shadow">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 text-primary animate-spin" /><span className="ml-2 text-sm text-muted-foreground">加载中...</span></div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground"><Key className="size-10 mb-3 opacity-30" /><p className="text-sm">{searchKeyword || searchToken ? '没有找到匹配的令牌' : '暂无令牌，点击上方按钮创建'}</p></div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-4 py-4 w-10"><Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} /></th>
              {['名称','状态','剩余额度/总额度','密钥','分组','可用模型','IP限制','创建时间','过期时间',''].map(h => (
                <th key={h} className="px-4 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {tokens.map(t => <TokenRow key={t.id} t={t} selected={selectedIds.has(t.id)} onSelect={() => toggleSelect(t.id)}
                visibleKeys={visibleKeys} resolvedKeys={resolvedKeys} loadingKeys={loadingKeys}
                copiedId={copiedId}
                onToggleKey={() => toggleKeyVisibility(t)} onCopyKey={() => copyTokenKey(t)}
                onToggle={() => handleToggle(t)} onEdit={() => openEdit(t)}
                onDelete={() => setDeleteTarget({ type: 'single', id: t.id })}
                onChat={() => openChatLink(t)} />)}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {total} 条</p>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <TokenFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editId={editId} form={form} setForm={setForm}
        submitting={submitting} onSubmit={handleSubmit} availableModels={availableModels} availableGroups={availableGroups} />

      {/* Delete Confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-red-500" />确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {deleteTarget?.type === 'batch' ? `确定要删除选中的 ${selectedIds.size} 个令牌吗？` : '删除后无法恢复，确定要删除这个令牌吗？'}
          </p>
          <DialogFooter>
            <DialogClose><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold">
              {deleting && <Loader2 className="size-4 mr-1.5 animate-spin" />}删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Token Row ──
function TokenRow({ t, selected, onSelect, visibleKeys, resolvedKeys, loadingKeys, copiedId,
  onToggleKey, onCopyKey, onToggle, onEdit, onDelete, onChat,
}: {
  t: Token; selected: boolean; onSelect: () => void;
  visibleKeys: Record<number, boolean>; resolvedKeys: Record<number, string>; loadingKeys: Record<number, boolean>;
  copiedId: number | null;
  onToggleKey: () => void; onCopyKey: () => void; onToggle: () => void; onEdit: () => void; onDelete: () => void; onChat: () => void;
}) {
  const revealed = visibleKeys[t.id];
  const keyLoading = loadingKeys[t.id];
  const displayKey = revealed && resolvedKeys[t.id] ? `sk-${resolvedKeys[t.id]}` : maskKey(t.key);

  // Quota progress
  const used = t.used_quota || 0;
  const remain = t.remain_quota || 0;
  const total = used + remain;
  const pct = total > 0 ? (remain / total) * 100 : 0;

  // Models
  const models = t.model_limits_enabled && t.model_limits ? t.model_limits.split(',').filter(Boolean) : [];

  // IPs
  const ips = t.allow_ips ? t.allow_ips.split('\n').map(s => s.trim()).filter(Boolean) : [];

  return (
    <tr className={`hover:bg-slate-50/50 transition-colors ${t.status !== 1 ? 'opacity-60' : ''}`}>
      <td className="px-4 py-4"><Checkbox checked={selected} onCheckedChange={onSelect} /></td>
      <td className="px-4 py-4 text-sm font-medium max-w-[160px] truncate">{t.name}</td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          t.status === 1 ? 'bg-emerald-50 text-emerald-600' : t.status === 3 ? 'bg-amber-50 text-amber-600' : t.status === 4 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
        }`}>
          <span className={`size-1.5 rounded-full ${t.status === 1 ? 'bg-emerald-500' : t.status === 3 ? 'bg-amber-500' : t.status === 4 ? 'bg-red-500' : 'bg-slate-400'}`} />
          {t.status === 1 ? '已启用' : t.status === 3 ? '已过期' : t.status === 4 ? '已耗尽' : '已禁用'}
        </span>
      </td>
      {/* Quota */}
      <td className="px-4 py-4">
        {t.unlimited_quota ? (
          <span className="text-xs text-slate-500">无限额度 <span className="text-muted-foreground">(已用 {fmtQuota(used)})</span></span>
        ) : (
          <div className="min-w-[100px]">
            <span className={`text-xs font-medium ${pct <= 10 ? 'text-red-500' : pct <= 30 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {fmtQuota(remain)} / {fmtQuota(total)}
            </span>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className={`h-full rounded-full transition-all ${pct > 30 ? 'bg-emerald-400' : pct > 10 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        )}
      </td>
      {/* Key */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 font-mono text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 max-w-[200px]">
          <span className="truncate flex-1">{displayKey}</span>
          <button onClick={onToggleKey} className="shrink-0 text-slate-400 hover:text-primary" disabled={!!keyLoading}>
            {keyLoading ? <Loader2 className="size-3.5 animate-spin" /> : revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
          <button onClick={onCopyKey} className="shrink-0 text-slate-400 hover:text-primary">
            {copiedId === t.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </td>
      {/* Group */}
      <td className="px-4 py-4">
        {t.group === 'auto' ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600" title="自动选择最优分组，不可用时自动降级">
            <Zap className="size-3" />智能熔断{t.cross_group_retry ? '(跨组)' : ''}
          </span>
        ) : t.group ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600">{t.group}</span>
        ) : (
          <span className="text-xs text-slate-400">默认</span>
        )}
      </td>
      {/* Model limits */}
      <td className="px-4 py-4">
        {models.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {models.slice(0, 3).map(m => <span key={m} className="px-1.5 py-0.5 rounded text-[10px] bg-primary/5 text-primary font-medium truncate max-w-[80px]">{m}</span>)}
            {models.length > 3 && <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">+{models.length - 3}</span>}
          </div>
        ) : (
          <span className="text-xs text-slate-400">无限制</span>
        )}
      </td>
      {/* IP */}
      <td className="px-4 py-4">
        {ips.length > 0 ? (
          <div className="flex items-center gap-1">
            <Globe className="size-3 text-slate-400" />
            <span className="text-xs text-slate-600">{ips[0]}</span>
            {ips.length > 1 && <span className="text-[10px] text-slate-400">+{ips.length - 1}</span>}
          </div>
        ) : (
          <span className="text-xs text-slate-400">无限制</span>
        )}
      </td>
      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">{fmtTime(t.created_time)}</td>
      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">{fmtTime(t.expired_time)}</td>
      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <div className="inline-flex rounded-lg overflow-hidden border border-slate-200">
            <button onClick={onChat} className="px-3 py-1.5 text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap">
              聊天
            </button>
            <button onClick={onChat} className="px-1.5 py-1.5 bg-white text-slate-500 hover:bg-slate-50 transition-colors border-l border-slate-200">
              <ChevronDown className="size-3" />
            </button>
          </div>
          {t.status === 1 ? (
            <button onClick={onToggle} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">禁用</button>
          ) : (
            <button onClick={onToggle} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap">启用</button>
          )}
          <button onClick={onEdit} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap">编辑</button>
          <button onClick={onDelete} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">删除</button>
        </div>
      </td>
    </tr>
  );
}

// ── Token Form Dialog ──
function TokenFormDialog({ open, onOpenChange, editId, form, setForm, submitting, onSubmit, availableModels, availableGroups }: {
  open: boolean; onOpenChange: (v: boolean) => void; editId: number | null;
  form: TokenForm; setForm: React.Dispatch<React.SetStateAction<TokenForm>>;
  submitting: boolean; onSubmit: () => void;
  availableModels: string[]; availableGroups: string[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editId ? '编辑令牌' : '创建令牌'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">名称</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="输入令牌名称" maxLength={50} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">无限额度</label>
            <Switch checked={form.unlimited_quota} onCheckedChange={(v: boolean) => setForm(f => ({ ...f, unlimited_quota: v }))} />
          </div>
          {!form.unlimited_quota && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">额度 (1$ = 500000)</label>
              <Input type="number" value={form.remain_quota} onChange={e => setForm(f => ({ ...f, remain_quota: Number(e.target.value) }))} />
              <p className="text-xs text-muted-foreground mt-1">≈ ${(form.remain_quota / 500000).toFixed(2)}</p>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">过期时间</label>
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form.expired_time === -1} onChange={e => setForm(f => ({ ...f, expired_time: e.target.checked ? -1 : Math.floor(Date.now() / 1000) + 86400 * 30 }))} className="accent-primary" />
                永不过期
              </label>
              {form.expired_time !== -1 && (
                <Input type="datetime-local" className="flex-1"
                  value={new Date(form.expired_time * 1000).toISOString().slice(0, 16)}
                  onChange={e => setForm(f => ({ ...f, expired_time: Math.floor(new Date(e.target.value).getTime() / 1000) }))} />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">限制可用模型</label>
            <Switch checked={form.model_limits_enabled} onCheckedChange={(v: boolean) => setForm(f => ({ ...f, model_limits_enabled: v }))} />
          </div>
          {form.model_limits_enabled && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">允许的模型</label>
              <Input value={form.model_limits} onChange={e => setForm(f => ({ ...f, model_limits: e.target.value }))} placeholder="逗号分隔，如 gpt-4o, claude-3-opus" />
              {availableModels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 max-h-32 overflow-y-auto">
                  {availableModels.map(m => {
                    const selected = form.model_limits.split(',').map(s => s.trim()).includes(m);
                    return (
                      <button key={m} type="button" onClick={() => {
                        const current = form.model_limits.split(',').map(s => s.trim()).filter(Boolean);
                        if (selected) setForm(f => ({ ...f, model_limits: current.filter(x => x !== m).join(', ') }));
                        else setForm(f => ({ ...f, model_limits: [...current, m].join(', ') }));
                      }} className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${selected ? 'bg-primary/15 text-primary font-bold' : 'bg-slate-50 text-slate-500 hover:bg-primary/10 hover:text-primary'}`}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">IP 限制</label>
            <Input value={form.allow_ips} onChange={e => setForm(f => ({ ...f, allow_ips: e.target.value }))} placeholder="CIDR 格式，每行一个，留空不限" />
            <p className="text-xs text-muted-foreground mt-1">支持 CIDR 格式，如 192.168.1.0/24</p>
          </div>
          {availableGroups.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">分组</label>
              <Select value={form.group} onValueChange={(value) => setForm(f => ({ ...f, group: String(value ?? '') }))}>
                <SelectTrigger size="default" className="w-full" aria-label="分组">
                  <SelectValue placeholder="默认" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">默认</SelectItem>
                  {availableGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
          <Button onClick={onSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
            {submitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {editId ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
