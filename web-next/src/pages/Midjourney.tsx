import { useState } from 'react';
import {
  Image, Search, ChevronDown, ChevronUp, Eye, Clock,
  CheckCircle, XCircle, Loader, Pause, HelpCircle,
  Palette, ZoomIn, Shuffle, FileText, RotateCcw, Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type MjStatus = 'SUCCESS' | 'IN_PROGRESS' | 'SUBMITTED' | 'FAILURE' | 'NOT_START';
type MjType = 'IMAGINE' | 'UPSCALE' | 'VARIATION' | 'DESCRIBE' | 'REROLL' | 'BLEND' | 'VIDEO';

interface MjLog {
  id: number;
  taskId: string;
  type: MjType;
  status: MjStatus;
  progress: number;
  prompt: string;
  imageUrl?: string;
  submitTime: number;
  finishTime?: number;
  channel: string;
}

const mockLogs: MjLog[] = [
  { id: 1, taskId: 'mj-abc123', type: 'IMAGINE', status: 'SUCCESS', progress: 100, prompt: 'a futuristic city at sunset, cyberpunk style --ar 16:9', imageUrl: '', submitTime: 1710400000, finishTime: 1710400045, channel: 'Midjourney' },
  { id: 2, taskId: 'mj-def456', type: 'UPSCALE', status: 'SUCCESS', progress: 100, prompt: 'upscale U1', imageUrl: '', submitTime: 1710400100, finishTime: 1710400120, channel: 'Midjourney' },
  { id: 3, taskId: 'mj-ghi789', type: 'VARIATION', status: 'IN_PROGRESS', progress: 65, prompt: 'variation V2', submitTime: 1710400200, channel: 'Midjourney' },
  { id: 4, taskId: 'mj-jkl012', type: 'IMAGINE', status: 'FAILURE', progress: 0, prompt: 'banned content test', submitTime: 1710400300, finishTime: 1710400305, channel: 'Midjourney' },
  { id: 5, taskId: 'mj-mno345', type: 'DESCRIBE', status: 'SUCCESS', progress: 100, prompt: '[image description]', submitTime: 1710400400, finishTime: 1710400410, channel: 'Midjourney' },
  { id: 6, taskId: 'dall-p01', type: 'IMAGINE', status: 'SUCCESS', progress: 100, prompt: 'a cat wearing a top hat, oil painting', imageUrl: '', submitTime: 1710400500, finishTime: 1710400515, channel: 'DALL·E 3' },
  { id: 7, taskId: 'mj-qrs678', type: 'REROLL', status: 'SUBMITTED', progress: 0, prompt: 'reroll previous generation', submitTime: 1710400600, channel: 'Midjourney' },
  { id: 8, taskId: 'mj-video1', type: 'VIDEO', status: 'IN_PROGRESS', progress: 30, prompt: 'a timelapse of flowers blooming', submitTime: 1710400700, channel: 'Midjourney' },
];

const typeConfig: Record<MjType, { label: string; icon: React.ElementType; color: string }> = {
  IMAGINE: { label: '绘图', icon: Palette, color: 'bg-blue-100 text-blue-700' },
  UPSCALE: { label: '放大', icon: ZoomIn, color: 'bg-orange-100 text-orange-700' },
  VARIATION: { label: '变换', icon: Shuffle, color: 'bg-purple-100 text-purple-700' },
  DESCRIBE: { label: '图生文', icon: FileText, color: 'bg-yellow-100 text-yellow-700' },
  REROLL: { label: '重绘', icon: RotateCcw, color: 'bg-indigo-100 text-indigo-700' },
  BLEND: { label: '混合', icon: Palette, color: 'bg-lime-100 text-lime-700' },
  VIDEO: { label: '视频', icon: Video, color: 'bg-cyan-100 text-cyan-700' },
};

const statusConfig: Record<MjStatus, { label: string; icon: React.ElementType; color: string }> = {
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

export default function MidjourneyPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = mockLogs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (search && !log.prompt.toLowerCase().includes(search.toLowerCase()) && !log.taskId.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Image className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">绘图日志</h1>
            <p className="text-sm text-muted-foreground">Midjourney / DALL·E 绘图任务记录</p>
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
              {s === 'all' ? '全部' : statusConfig[s as MjStatus].label}
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
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">渠道</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">耗时</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">提交时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((log) => {
              const tc = typeConfig[log.type] || { label: '未知', icon: HelpCircle, color: 'bg-slate-100 text-slate-500' };
              const sc = statusConfig[log.status];
              const TypeIcon = tc.icon;
              const StatusIcon = sc.icon;
              const duration = log.finishTime ? log.finishTime - log.submitTime : null;
              const expanded = expandedId === log.id;

              return (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{log.taskId}</td>
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
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${log.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{log.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{log.channel}</td>
                  <td className="px-6 py-4">
                    {duration !== null ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${duration > 60 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {duration}s
                      </span>
                    ) : <span className="text-xs text-slate-400">-</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatTime(log.submitTime)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={() => setExpandedId(expanded ? null : log.id)}>
                      {expanded ? <ChevronUp className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">暂无绘图日志</div>
        )}
      </div>
    </div>
  );
}
