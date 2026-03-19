import { useState, useEffect, useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Key,
  Link2,
  Loader2,
  Plus,
  Search,
  Trash2,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { API } from '@/api/client';
import { useStatus } from '@/contexts/StatusContext';
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

interface GroupOption {
  value: string;
  label: string;
}

interface TokenForm {
  name: string;
  remain_quota: number;
  unlimited_quota: boolean;
  expired_time: number;
  model_limits: string;
  allow_ips: string;
  group: string;
  cross_group_retry: boolean;
  tokenCount: number;
}

// ── Helpers ──
const DEFAULT_GROUP_VALUE = '__default__';
const QUICK_QUOTA_OPTIONS = [
  { label: '1$', value: 500000 },
  { label: '10$', value: 5000000 },
  { label: '50$', value: 25000000 },
  { label: '100$', value: 50000000 },
];

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

function splitModelLimits(modelLimits: string) {
  return Array.from(
    new Set(
      modelLimits
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function joinModelLimits(modelLimits: string[]) {
  return splitModelLimits(modelLimits.join(',')).join(',');
}

function formatDateTimeLocal(timestamp: number) {
  if (timestamp <= 0) return '';
  const date = new Date(timestamp * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateTimeLocal(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? NaN : Math.ceil(timestamp / 1000);
}

function getRelativeExpiry(month = 0, day = 0, hour = 0, minute = 0) {
  const seconds =
    month * 30 * 24 * 60 * 60 +
    day * 24 * 60 * 60 +
    hour * 60 * 60 +
    minute * 60;
  return seconds === 0 ? -1 : Math.floor(Date.now() / 1000) + seconds;
}

function getInitialForm(): TokenForm {
  return {
    name: '',
    remain_quota: 0,
    unlimited_quota: true,
    expired_time: -1,
    model_limits: '',
    allow_ips: '',
    group: '',
    cross_group_retry: false,
    tokenCount: 1,
  };
}

function generateRandomSuffix() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function normalizeGroupOptions(data: unknown, defaultUseAutoGroup: boolean): GroupOption[] {
  let options: GroupOption[] = [];

  if (Array.isArray(data)) {
    options = data
      .map((group) => String(group || '').trim())
      .filter(Boolean)
      .map((group) => ({ value: group, label: group }));
  } else if (data && typeof data === 'object') {
    options = Object.entries(data as Record<string, { desc?: string }>)
      .map(([group, info]) => ({
        value: group,
        label: info?.desc || group,
      }))
      .filter((group) => group.value);
  }

  if (defaultUseAutoGroup && options.some((group) => group.value === 'auto')) {
    options.sort((left, right) => {
      if (left.value === 'auto') return -1;
      if (right.value === 'auto') return 1;
      return left.value.localeCompare(right.value, 'zh-CN');
    });
    return options;
  }

  return options.sort((left, right) => left.value.localeCompare(right.value, 'zh-CN'));
}

export default function TokenPage() {
  const { status } = useStatus();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchToken, setSearchToken] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TokenForm>(getInitialForm);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single'; id: number } | { type: 'batch' } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GroupOption[]>([]);

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
      const params: Record<string, string | number> = { p: page, size: pageSize };
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
        const fullKey = res.data?.data?.key || '';
        if (!res.data?.success || !fullKey) {
          throw new Error(res.data?.message || '获取密钥失败');
        }
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
  const fetchFormOptions = useCallback(async () => {
    try {
      const [modelsRes, groupsRes] = await Promise.all([
        API.get('/api/user/models'),
        API.get('/api/user/self/groups'),
      ]);
      if (modelsRes.data.success) {
        setAvailableModels(Array.isArray(modelsRes.data.data) ? modelsRes.data.data : []);
      }
      if (groupsRes.data.success) {
        setAvailableGroups(
          normalizeGroupOptions(groupsRes.data.data, Boolean(status?.default_use_auto_group)),
        );
      }
    } catch { /* ignore */ }
  }, [status]);

  const fetchTokenDetail = useCallback(async (tokenId: number) => {
    const res = await API.get(`/api/token/${tokenId}`);
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || '获取令牌详情失败');
    }
    return res.data.data as Token;
  }, []);

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
  const resetDialog = useCallback(() => {
    setEditId(null);
    setForm(getInitialForm());
    setDialogLoading(false);
  }, []);

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetDialog();
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(getInitialForm());
    setDialogOpen(true);
  };
  const openEdit = (token: Token) => {
    setEditId(token.id);
    setForm(getInitialForm());
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!dialogOpen) return undefined;

    let cancelled = false;

    const loadDialogData = async () => {
      setDialogLoading(true);
      try {
        await fetchFormOptions();
        if (cancelled) return;

        if (editId === null) {
          setForm(getInitialForm());
          return;
        }

        const token = await fetchTokenDetail(editId);
        if (cancelled) return;

        setForm({
          name: token.name || '',
          remain_quota: token.remain_quota ?? 0,
          unlimited_quota: Boolean(token.unlimited_quota),
          expired_time: token.expired_time ?? -1,
          model_limits: token.model_limits || '',
          allow_ips: token.allow_ips || '',
          group: token.group || '',
          cross_group_retry: Boolean(token.cross_group_retry),
          tokenCount: 1,
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : '获取令牌详情失败');
          setDialogOpen(false);
          resetDialog();
        }
      } finally {
        if (!cancelled) {
          setDialogLoading(false);
        }
      }
    };

    loadDialogData();

    return () => {
      cancelled = true;
    };
  }, [dialogOpen, editId, fetchFormOptions, fetchTokenDetail, resetDialog]);

  const handleSubmit = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error('请输入名称');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (form.expired_time !== -1) {
      if (!Number.isFinite(form.expired_time)) {
        toast.error('过期时间格式错误！');
        return;
      }
      if (form.expired_time <= now) {
        toast.error('过期时间不能早于当前时间！');
        return;
      }
    }

    if (!form.unlimited_quota && form.remain_quota < 0) {
      toast.error('额度不能小于 0');
      return;
    }

    setSubmitting(true);
    try {
      const modelLimits = joinModelLimits(splitModelLimits(form.model_limits));
      const allowIps = form.allow_ips
        .split('\n')
        .map((ip) => ip.trim())
        .filter(Boolean)
        .join('\n');
      const payload = {
        remain_quota: Number(form.remain_quota) || 0,
        unlimited_quota: form.unlimited_quota,
        expired_time: form.expired_time,
        model_limits_enabled: modelLimits.length > 0,
        model_limits: modelLimits,
        allow_ips: allowIps,
        group: form.group,
        cross_group_retry: form.group === 'auto' ? form.cross_group_retry : false,
      };

      if (editId !== null) {
        const res = await API.put('/api/token/', {
          ...payload,
          id: editId,
          name,
        });
        if (res.data.success) {
          toast.success('令牌已更新');
          setDialogOpen(false);
          resetDialog();
          fetchTokens();
        } else {
          toast.error(res.data.message || '操作失败');
        }
        return;
      }

      const count = Math.max(1, Math.trunc(Number(form.tokenCount) || 1));
      let successCount = 0;

      for (let i = 0; i < count; i += 1) {
        const tokenName = i === 0 ? name : `${name}-${generateRandomSuffix()}`;
        const res = await API.post('/api/token/', {
          ...payload,
          name: tokenName,
        });
        if (!res.data.success) {
          toast.error(res.data.message || '操作失败');
          break;
        }
        successCount += 1;
      }

      if (successCount > 0) {
        toast.success('令牌创建成功，请在列表页面点击复制获取令牌！');
        setDialogOpen(false);
        resetDialog();
        fetchTokens();
      }
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
      <TokenFormDialog open={dialogOpen} onOpenChange={handleDialogOpenChange} editId={editId} form={form} setForm={setForm}
        dialogLoading={dialogLoading} submitting={submitting} onSubmit={handleSubmit} availableModels={availableModels} availableGroups={availableGroups} />

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

interface TokenFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editId: number | null;
  form: TokenForm;
  setForm: Dispatch<SetStateAction<TokenForm>>;
  dialogLoading: boolean;
  submitting: boolean;
  onSubmit: () => void;
  availableModels: string[];
  availableGroups: GroupOption[];
}

// ── Token Form Dialog ──
function TokenFormDialog(props: TokenFormDialogProps) {
  const {
    open,
    onOpenChange,
    editId,
    form,
    setForm,
    dialogLoading,
    submitting,
    onSubmit,
    availableModels,
    availableGroups,
  } = props;
  const selectedModels = splitModelLimits(form.model_limits);
  const neverExpires = form.expired_time === -1;

  const updateModelLimits = (models: string[]) => {
    setForm((current) => ({ ...current, model_limits: joinModelLimits(models) }));
  };

  const toggleModelLimit = (model: string) => {
    const currentModels = splitModelLimits(form.model_limits);
    const nextModels = currentModels.includes(model)
      ? currentModels.filter((item) => item !== model)
      : [...currentModels, model];
    updateModelLimits(nextModels);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? '编辑令牌' : '创建新的令牌'}</DialogTitle>
        </DialogHeader>
        {dialogLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="ml-2 text-sm">加载中...</span>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            <div className="rounded-[28px] border border-primary/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Key className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">基本信息</h3>
                  <p className="text-sm text-muted-foreground">设置令牌的基本信息</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">名称</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                    placeholder="请输入名称"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">令牌分组</label>
                  {availableGroups.length > 0 ? (
                    <Select
                      value={form.group || DEFAULT_GROUP_VALUE}
                      onValueChange={(value) => {
                        const nextGroup = value === DEFAULT_GROUP_VALUE ? '' : String(value ?? '');
                        setForm((current) => ({
                          ...current,
                          group: nextGroup,
                          cross_group_retry: nextGroup === 'auto' ? current.cross_group_retry : false,
                        }));
                      }}
                    >
                      <SelectTrigger size="default" className="w-full" aria-label="令牌分组">
                        <SelectValue placeholder="令牌分组，默认为用户的分组" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={DEFAULT_GROUP_VALUE}>令牌分组，默认为用户的分组</SelectItem>
                          {availableGroups.map((group) => (
                            <SelectItem key={group.value} value={group.value}>
                              {group.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value="管理员未设置用户可选分组" disabled />
                  )}
                </div>

                {form.group === 'auto' && (
                  <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">跨分组重试</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          开启后，当前分组渠道失败时会按顺序尝试下一个分组的渠道
                        </p>
                      </div>
                      <Switch
                        checked={form.cross_group_retry}
                        onCheckedChange={(checked: boolean) => {
                          setForm((current) => ({ ...current, cross_group_retry: checked }));
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">过期时间</label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={neverExpires}
                          onCheckedChange={(checked) => {
                            setForm((current) => ({
                              ...current,
                              expired_time: checked ? -1 : getRelativeExpiry(1, 0, 0, 0),
                            }));
                          }}
                        />
                        永不过期
                      </label>
                      {!neverExpires && (
                        <Input
                          type="datetime-local"
                          className="flex-1"
                          value={formatDateTimeLocal(form.expired_time)}
                          onChange={(e) => {
                            const timestamp = parseDateTimeLocal(e.target.value);
                            setForm((current) => ({
                              ...current,
                              expired_time: Number.isNaN(timestamp) ? current.expired_time : timestamp,
                            }));
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">过期时间快捷设置</label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant={neverExpires ? 'default' : 'outline'} size="sm" onClick={() => setForm((current) => ({ ...current, expired_time: -1 }))}>
                        永不过期
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setForm((current) => ({ ...current, expired_time: getRelativeExpiry(1, 0, 0, 0) }))}>
                        一个月
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setForm((current) => ({ ...current, expired_time: getRelativeExpiry(0, 1, 0, 0) }))}>
                        一天
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setForm((current) => ({ ...current, expired_time: getRelativeExpiry(0, 0, 1, 0) }))}>
                        一小时
                      </Button>
                    </div>
                  </div>
                </div>

                {editId === null && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">新建数量</label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={form.tokenCount}
                      onChange={(e) => {
                        const nextValue = Math.max(1, Math.trunc(Number(e.target.value) || 1));
                        setForm((current) => ({ ...current, tokenCount: nextValue }));
                      }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">批量创建时会在名称后自动添加随机后缀</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-primary/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">额度设置</h3>
                  <p className="text-sm text-muted-foreground">设置令牌可用额度和数量</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">额度</label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    disabled={form.unlimited_quota}
                    value={form.remain_quota}
                    onChange={(e) => {
                      const nextValue = Math.max(0, Math.trunc(Number(e.target.value) || 0));
                      setForm((current) => ({ ...current, remain_quota: nextValue }));
                    }}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUICK_QUOTA_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={form.unlimited_quota}
                        onClick={() => setForm((current) => ({ ...current, remain_quota: option.value }))}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">等价金额：{fmtQuota(form.remain_quota)}</p>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">无限额度</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        令牌的额度仅用于限制令牌本身的最大额度使用量，实际的使用受到账户的剩余额度限制
                      </p>
                    </div>
                    <Switch
                      checked={form.unlimited_quota}
                      onCheckedChange={(checked: boolean) => {
                        setForm((current) => ({ ...current, unlimited_quota: checked }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-primary/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-600">
                  <Link2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">访问限制</h3>
                  <p className="text-sm text-muted-foreground">设置令牌的访问限制</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">模型限制列表</label>
                  <Input
                    value={form.model_limits}
                    onChange={(e) => setForm((current) => ({ ...current, model_limits: e.target.value }))}
                    placeholder="请选择该令牌支持的模型，留空支持所有模型"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">非必要，不建议启用模型限制</p>
                </div>

                {availableModels.length > 0 && (
                  <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex flex-wrap gap-2">
                      {availableModels.map((model) => {
                        const selected = selectedModels.includes(model);
                        return (
                          <button
                            key={model}
                            type="button"
                            onClick={() => toggleModelLimit(model)}
                            className={`rounded-full px-3 py-1 text-xs transition-colors ${
                              selected
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-primary hover:ring-primary/30'
                            }`}
                          >
                            {model}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium">IP白名单（支持CIDR表达式）</label>
                  <Textarea
                    rows={3}
                    value={form.allow_ips}
                    onChange={(e) => setForm((current) => ({ ...current, allow_ips: e.target.value }))}
                    placeholder="允许的IP，一行一个，不填写则不限制"
                    className="min-h-24 rounded-xl border-primary/10 bg-white px-4 py-3 text-[15px] shadow-sm hover:border-primary/35 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    请勿过度信任此功能，IP可能被伪造，请配合 nginx 和 CDN 等网关使用
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
          <Button onClick={onSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
            {submitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            提交
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
