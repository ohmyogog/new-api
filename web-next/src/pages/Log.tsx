import { useState } from 'react';
import {
  ScrollText, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// ── Types ──
interface LogEntry {
  id: number; created_at: number; model: string;
  prompt_tokens: number; completion_tokens: number;
  quota: number; token_name: string; content: string; type: number;
}

// ── Mock data ──
const now = Math.floor(Date.now() / 1000);
const models = ['gpt-4o', 'claude-3-opus', 'gemini-pro', 'gpt-4o-mini', 'claude-3-haiku', 'deepseek-v3'];
const mockLogs: LogEntry[] = Array.from({ length: 35 }, (_, i) => ({
  id: i + 1, created_at: now - i * 3600,
  model: models[i % models.length],
  prompt_tokens: Math.floor(Math.random() * 2000) + 100,
  completion_tokens: Math.floor(Math.random() * 1000) + 50,
  quota: Math.floor(Math.random() * 5000) + 100,
  token_name: `Token-${(i % 3) + 1}`,
  content: `请求 ${models[i % models.length]} 模型完成对话`,
  type: i % 5 === 0 ? 2 : 1,
}));

function fmtQuota(q: number) { return `$${(q / 500000).toFixed(4)}`; }
function fmtTime(t: number) { return new Date(t * 1000).toLocaleString('zh-CN'); }

export default function LogPage() {
  const [logs] = useState<LogEntry[]>(mockLogs);
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const perPage = 10;
  const filtered = logs.filter(l => {
    if (search && !l.token_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (modelFilter && !l.model.toLowerCase().includes(modelFilter.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageLogs = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><ScrollText className="size-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold">使用日志</h1><p className="text-sm text-muted-foreground">查看 API 调用记录和消费明细</p></div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索令牌名称..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-11 w-64" />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="筛选模型..." value={modelFilter} onChange={e => { setModelFilter(e.target.value); setPage(1); }} className="pl-11 w-56" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['时间','模型','提示 Token','完成 Token','额度','令牌','详情'].map(h => (
              <th key={h} className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {pageLogs.map(l => (
              <>
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm text-muted-foreground">{fmtTime(l.created_at)}</td>
                  <td className="px-8 py-5"><span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">{l.model}</span></td>
                  <td className="px-8 py-5 text-sm font-medium">{l.prompt_tokens.toLocaleString()}</td>
                  <td className="px-8 py-5 text-sm font-medium">{l.completion_tokens.toLocaleString()}</td>
                  <td className="px-8 py-5 text-sm font-medium">{fmtQuota(l.quota)}</td>
                  <td className="px-8 py-5 text-sm text-muted-foreground">{l.token_name}</td>
                  <td className="px-8 py-5">
                    <button onClick={() => setExpandedId(expandedId === l.id ? null : l.id)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center">
                      {expandedId === l.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  </td>
                </tr>
                {expandedId === l.id && (
                  <tr key={`${l.id}-detail`}><td colSpan={7} className="px-8 py-5 bg-slate-50/50">
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">类型：</span>{l.type === 2 ? '流式' : '普通'}</p>
                      <p><span className="text-muted-foreground">内容：</span>{l.content}</p>
                      <p><span className="text-muted-foreground">总 Token：</span>{(l.prompt_tokens + l.completion_tokens).toLocaleString()}</p>
                    </div>
                  </td></tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {filtered.length} 条</p>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
        </div>
      </div>
    </div>
  );
}
