import { useState } from 'react';
import {
  CheckSquare, Search, Eye, ChevronUp, Clock,
  CheckCircle, XCircle, Loader, Pause, Play, HelpCircle,
  Music, FileText, Sparkles, Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type TaskStatus = 'SUCCESS' | 'IN_PROGRESS' | 'SUBMITTED' | 'FAILURE' | 'NOT_START';
type TaskType = 'MUSIC' | 'LYRICS' | 'VIDEO_GEN' | 'TEXT_VIDEO' | 'IMG_VIDEO' | 'REMIX';

interface TaskLog {
  id: number;
  taskId: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  platform: string;
  submitTime: number;
  finishTime?: number;
  prompt: string;
}

const mockTasks: TaskLog[] = [
  { id: 1, taskId: 'suno-a1b2c3', type: 'MUSIC', status: 'SUCCESS', progress: 100, platform: 'Suno', submitTime: 1710400000, finishTime: 1710400120, prompt: 'upbeat jazz with saxophone' },
  { id: 2, taskId: 'suno-d4e5f6', type: 'LYRICS', status: 'SUCCESS', progress: 100, platform: 'Suno', submitTime: 1710400200, finishTime: 1710400215, prompt: 'love song about the ocean' },
  { id: 3, taskId: 'kling-g7h8i9', type: 'IMG_VIDEO', status: 'IN_PROGRESS', progress: 45, platform: 'Kling', submitTime: 1710400300, prompt: 'cat jumping in slow motion' },
  { id: 4, taskId: 'kling-j0k1l2', type: 'TEXT_VIDEO', status: 'SUBMITTED', progress: 0, platform: 'Kling', submitTime: 1710400400, prompt: 'a rocket launching into space' },
  { id: 5, taskId: 'luma-m3n4o5', type: 'VIDEO_GEN', status: 'FAILURE', progress: 0, platform: 'Luma', submitTime: 1710400500, finishTime: 1710400505, prompt: 'underwater coral reef timelapse' },
  { id: 6, taskId: 'suno-p6q7r8', type: 'MUSIC', status: 'IN_PROGRESS', progress: 70, platform: 'Suno', submitTime: 1710400600, prompt: 'lo-fi hip hop beats' },
  { id: 7, taskId: 'kling-remix1', type: 'REMIX', status: 'SUCCESS', progress: 100, platform: 'Kling', submitTime: 1710400700, finishTime: 1710400780, prompt: 'remix with different style' },
];

const typeConfig: Record<TaskType, { label: string; icon: React.ElementType; color: string }> = {
  MUSIC: { label: '生成音乐', icon: Music, color: 'bg-violet-100 text-violet-700' },
  LYRICS: { label: '生成歌词', icon: FileText, color: 'bg-pink-100 text-pink-700' },
  VIDEO_GEN: { label: '图生视频', icon: Sparkles, color: 'bg-blue-100 text-blue-700' },
  TEXT_VIDEO: { label: '文生视频', icon: Sparkles, color: 'bg-cyan-100 text-cyan-700' },
  IMG_VIDEO: { label: '图生视频', icon: Video, color: 'bg-teal-100 text-teal-700' },
  REMIX: { label: '视频Remix', icon: Sparkles, color: 'bg-orange-100 text-orange-700' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; color: string }> = {
  SUCCESS: { label: '成功', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  IN_PROGRESS: { label: '进行中', icon: Loader, color: 'bg-blue-100 text-blue-700' },
  SUBMITTED: { label: '队列中', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  FAILURE: { label: '失败', icon: XCircle, color: 'bg-red-100 text-red-700' },
  NOT_START: { label: '未启动', icon: Pause, color: 'bg-slate-100 text-slate-500' },
};

function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export default function TaskPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = mockTasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.prompt.toLowerCase().includes(search.toLowerCase()) && !t.taskId.includes(search)) return false;
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
            placeholder="搜索提示词或任务ID..."
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
              {s === 'all' ? '全部' : statusConfig[s as TaskStatus].label}
            </button>
          ))}
        </div>
      </div>

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
              const tc = typeConfig[task.type] || { label: '未知', icon: HelpCircle, color: 'bg-slate-100 text-slate-500' };
              const sc = statusConfig[task.status];
              const TypeIcon = tc.icon;
              const StatusIcon = sc.icon;
              const duration = task.finishTime ? task.finishTime - task.submitTime : null;
              const expanded = expandedId === task.id;

              return (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{task.taskId}</td>
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
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{task.platform}</span>
                  </td>
                  <td className="px-6 py-4">
                    {duration !== null ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${duration > 60 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {duration}s
                      </span>
                    ) : <span className="text-xs text-slate-400">-</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatTime(task.submitTime)}</td>
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
    </div>
  );
}
