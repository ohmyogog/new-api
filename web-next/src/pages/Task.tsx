import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Search, Eye, ChevronUp, Clock,
  CheckCircle, XCircle, Loader, Pause, HelpCircle,
  Music, FileText, Sparkles, Video,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

interface TaskLog {
  id: number;
  task_id?: string;
  action: string;
  status: string;
  progress: string | number;
  fail_reason?: string;
  submit_time: number;
  start_time?: number;
  finish_time?: number;
  platform?: string;
  channel_id?: number;
  user_id?: number;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  MUSIC: { label: '生成音乐', icon: Music, color: 'bg-violet-100 text-violet-700' },
  LYRICS: { label: '生成歌词', icon: FileText, color: 'bg-pink-100 text-pink-700' },
  VIDEO_GEN: { label: '图生视频', icon: Sparkles, color: 'bg-blue-100 text-blue-700' },
  TEXT_VIDEO: { label: '文生视频', icon: Sparkles, color: 'bg-cyan-100 text-cyan-700' },
  IMG_VIDEO: { label: '图生视频', icon: Video, color: 'bg-teal-100 text-teal-700' },
  REMIX: { label: '视频Remix', icon: Sparkles, color: 'bg-orange-100 text-orange-700' },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  SUCCESS: { label: '成功', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  IN_PROGRESS: { label: '进行中', icon: Loader, color: 'bg-blue-100 text-blue-700' },
  SUBMITTED: { label: '队列中', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  FAILURE: { label: '失败', icon: XCircle, color: 'bg-red-100 text-red-700' },
  NOT_START: { label: '未启动', icon: Pause, color: 'bg-slate-100 text-slate-500' },
};

function formatTime(ts: number) {
  if (!ts) return '-';
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function parseProgress(p: string | number | undefined): number {
  if (typeof p === 'number') return p;
  if (!p) return 0;
  const n = parseInt(String(p).replace('%', ''), 10);
  return isNaN(n) ? 0 : n;
}

export default function TaskPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isAdmin = (getUser()?.role ?? 0) >= 10;

  const fetchTasks = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const base = isAdmin ? '/api/task/' : '/api/task/self';
      const res = await API.get(`${base}?p=${p}&page_size=${pageSize}`);
      if (res.data.success) {
        const data = res.data.data;
        if (Array.isArray(data)) {
          setTasks(data);
          setTotal(data.length >= pageSize ? p * pageSize + 1 : (p - 1) * pageSize + data.length);
        } else {
          setTasks(data?.items ?? []);
          setTotal(data?.total ?? 0);
        }
      } else {
        toast.error(res.data.message || '加载失败');
      }
    } catch {
      toast.error('加载任务日志失败');
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => { fetchTasks(page); }, [page]);

  const filtered = tasks.filter((t) => {
    const status = (t.status ?? '').toUpperCase();
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (search && !(t.task_id ?? '').includes(search) && !(t.action ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckSquare className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">任务日志</h1>
            <p className="text-sm text-muted-foreground">Suno / Kling / Luma 等任务记录</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            placeholder="搜索任务ID或类型..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'SUCCESS', 'IN_PROGRESS', 'SUBMITTED', 'FAILURE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              {s === 'all' ? '全部' : (statusConfig[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">任务ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">类型</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">状态</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">进度</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">平台</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">耗时</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">提交时间</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((task) => {
                const action = (task.action ?? '').toUpperCase();
                const tc = typeConfig[action] || { label: action || '未知', icon: HelpCircle, color: 'bg-slate-100 text-slate-500' };
                const status = (task.status ?? '').toUpperCase();
                const sc = statusConfig[status] || { label: status || '未知', icon: HelpCircle, color: 'bg-slate-100 text-slate-500' };
                const TypeIcon = tc.icon;
                const StatusIcon = sc.icon;
                const progress = parseProgress(task.progress);
                const duration = task.finish_time && task.submit_time ? task.finish_time - task.submit_time : null;
                const expanded = expandedId === task.id;

                return (
                  <tr key={task.id || task.task_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{task.task_id || task.id}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${tc.color}`}>
                        <TypeIcon className="size-3.5" />{tc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.color}`}>
                        <StatusIcon className="size-3.5" />{sc.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">{task.platform || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {duration !== null ? (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${duration > 60 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {duration}s
                        </span>
                      ) : <span className="text-xs text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatTime(task.submit_time)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={() => setExpandedId(expanded ? null : task.id)}>
                        {expanded ? <ChevronUp className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">暂无任务日志</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">共 {total} 条</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
            <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
