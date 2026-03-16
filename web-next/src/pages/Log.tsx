import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollText, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter,
  Clock, Zap, Activity, Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

// ── Types ──
interface LogEntry {
  id: number;
  user_id: number;
  created_at: number;
  type: number;
  content: string;
  username: string;
  token_name: string;
  model_name: string;
  quota: number;
  prompt_tokens: number;
  completion_tokens: number;
  use_time: number;
  is_stream: boolean;
  channel: number;
  channel_name: string;
  group: string;
  request_id: string;
}

interface StatData {
  quota: number;
  rpm: number;
  tpm: number;
}

// ── Helpers ──
function getUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function fmtQuota(q: number) { return `$${(q / 500000).toFixed(4)}`; }

function fmtTime(t: number) {
  if (t <= 0) return '-';
  return new Date(t * 1000).toLocaleString('zh-CN');
}

function fmtDuration(ms: number) {
  if (ms <= 0) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

const logTypeMap: Record<number, { label: string; color: string }> = {
  0: { label: '未知', color: 'bg-slate-100 text-slate-500' },
  1: { label: '充值', color: 'bg-amber-50 text-amber-600' },
  2: { label: '消费', color: 'bg-blue-50 text-blue-600' },
  3: { label: '管理', color: 'bg-purple-50 text-purple-600' },
  4: { label: '系统', color: 'bg-slate-100 text-slate-600' },
  5: { label: '错误', color: 'bg-red-50 text-red-600' },
  6: { label: '退款', color: 'bg-emerald-50 text-emerald-600' },
};

function LogRow({ log: l, typeInfo, expanded, isAdmin, onToggle }: {
  log: LogEntry; typeInfo: { label: string; color: string };
  expanded: boolean; isAdmin: boolean; onToggle: () => void;
}) {
  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-colors">
        <td className="px-6 py-5 text-sm text-muted-foreground whitespace-nowrap">{fmtTime(l.created_at)}</td>
        <td className="px-6 py-5">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${typeInfo.color}`}>{typeInfo.label}</span>
        </td>
        <td className="px-6 py-5">
          {l.model_name ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">{l.model_name}</span>
          ) : <span className="text-sm text-muted-foreground">-</span>}
        </td>
        <td className="px-6 py-5 text-sm font-medium">{l.prompt_tokens.toLocaleString()}</td>
        <td className="px-6 py-5 text-sm font-medium">{l.completion_tokens.toLocaleString()}</td>
        <td className="px-6 py-5 text-sm font-medium">{fmtQuota(l.quota)}</td>
        <td className="px-6 py-5 text-sm text-muted-foreground whitespace-nowrap">{fmtDuration(l.use_time)}</td>
        <td className="px-6 py-5 text-sm text-muted-foreground">{l.token_name || '-'}</td>
        <td className="px-6 py-5">
          <button onClick={onToggle} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center">
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr><td colSpan={9} className="px-6 py-5 bg-slate-50/50">
          <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
            <p><span className="text-muted-foreground">流式：</span>{l.is_stream ? '是' : '否'}</p>
            <p><span className="text-muted-foreground">总 Token：</span>{(l.prompt_tokens + l.completion_tokens).toLocaleString()}</p>
            {isAdmin && l.username && <p><span className="text-muted-foreground">用户：</span>{l.username}</p>}
            {isAdmin && l.channel > 0 && <p><span className="text-muted-foreground">渠道：</span>{l.channel_name || `#${l.channel}`}</p>}
            {l.group && <p><span className="text-muted-foreground">分组：</span>{l.group}</p>}
            {l.request_id && <p><span className="text-muted-foreground">请求 ID：</span><span className="font-mono text-xs">{l.request_id}</span></p>}
            {l.content && <p className="col-span-full"><span className="text-muted-foreground">内容：</span>{l.content}</p>}
          </div>
        </td></tr>
      )}
    </>
  );
}

export default function LogPage() {
  const user = getUser();
  const isAdmin = (user?.role ?? 0) >= 10;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [stat, setStat] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statLoading, setStatLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedModel, setDebouncedModel] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Debounce filter inputs (500ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedModel(modelFilter);
      setPage(1);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [search, modelFilter]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const base = isAdmin ? '/api/log/' : '/api/log/self';
      const params: Record<string, string | number> = { p: page, page_size: perPage };
      if (debouncedSearch) params.token_name = debouncedSearch;
      if (debouncedModel) params.model_name = debouncedModel;
      const res = await API.get(base, { params });
      const d = res.data;
      if (d.success) {
        setLogs(d.data?.items ?? []);
        setTotal(d.data?.total ?? 0);
      } else {
        toast.error(d.message || '获取日志失败');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '获取日志失败');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, debouncedModel, isAdmin]);

  const fetchStat = useCallback(async () => {
    setStatLoading(true);
    try {
      const url = isAdmin ? '/api/log/stat' : '/api/log/self/stat';
      const res = await API.get(url);
      const d = res.data;
      if (d.success) {
        setStat(d.data);
      }
    } catch {
      // stat is non-critical, silently ignore
    } finally {
      setStatLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStat(); }, [fetchStat]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><ScrollText className="size-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold">使用日志</h1><p className="text-sm text-muted-foreground">查看 API 调用记录和消费明细</p></div>
      </div>

      {/* Stats */}
      {stat && !statLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-3xl soft-shadow p-6 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Zap className="size-5 text-primary" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">总消费</p><p className="text-xl font-bold mt-0.5">{fmtQuota(stat.quota)}</p></div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl soft-shadow p-6 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center"><Activity className="size-5 text-blue-500" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">RPM</p><p className="text-xl font-bold mt-0.5">{stat.rpm.toLocaleString()}</p></div>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl soft-shadow p-6 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Clock className="size-5 text-emerald-500" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">TPM</p><p className="text-xl font-bold mt-0.5">{stat.tpm.toLocaleString()}</p></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索令牌名称..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 w-64" />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="筛选模型..." value={modelFilter} onChange={e => setModelFilter(e.target.value)} className="pl-11 w-56" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['时间', '类型', '模型', '提示 Token', '完成 Token', '额度', '耗时', '令牌', '详情'].map(h => (
              <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={9} className="px-6 py-16 text-center">
                <Loader2 className="size-6 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">加载中...</p>
              </td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-16 text-center text-sm text-muted-foreground">暂无日志记录</td></tr>
            ) : logs.map(l => {
              const typeInfo = logTypeMap[l.type] ?? logTypeMap[0];
              return (
                <LogRow key={l.id} log={l} typeInfo={typeInfo} expanded={expandedId === l.id} isAdmin={isAdmin}
                  onToggle={() => setExpandedId(expandedId === l.id ? null : l.id)} />
              );
            })}
          </tbody>
        </table>
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
    </div>
  );
}
