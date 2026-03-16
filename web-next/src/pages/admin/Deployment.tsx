import { useState, useEffect, useCallback } from 'react';
import { Server, Search, Trash2, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

interface Deployment {
  id: string;
  deployment_name: string;
  status: string;
  hardware_info: string;
  hardware_name: string;
  brand_name: string;
  hardware_quantity: number;
  time_remaining: string;
  completed_percent: number;
  created_at: number;
  provider: string;
}

interface DeploymentSettings {
  provider: string;
  enabled: boolean;
  configured: boolean;
  can_connect: boolean;
}

const statusStyles: Record<string, string> = {
  running: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  completed: 'bg-blue-50 text-blue-600 border-blue-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  'deployment requested': 'bg-amber-50 text-amber-600 border-amber-200',
  'termination requested': 'bg-orange-50 text-orange-600 border-orange-200',
  destroyed: 'bg-slate-50 text-slate-500 border-slate-200',
};

const statusLabels: Record<string, string> = {
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  'deployment requested': '部署中',
  'termination requested': '终止中',
  destroyed: '已销毁',
};

export default function DeploymentPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [settings, setSettings] = useState<DeploymentSettings | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deployment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 20;

  const fetchSettings = useCallback(async () => {
    try {
      const res = await API.get('/api/deployments/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    try {
      const url = search.trim()
        ? `/api/deployments/search?keyword=${encodeURIComponent(search.trim())}&p=${page}&size=${pageSize}`
        : `/api/deployments/?p=${page}&size=${pageSize}`;
      const res = await API.get(url);
      if (res.data.success) {
        setDeployments(res.data.data.items || []);
        setTotal(res.data.data.total || 0);
      } else {
        toast.error(res.data.message || '加载失败');
      }
    } catch {
      toast.error('加载部署列表失败');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { fetchDeployments(); }, [fetchDeployments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await API.delete(`/api/deployments/${deleteTarget.id}`);
      if (res.data.success) {
        toast.success('删除成功');
        setDeleteTarget(null);
        fetchDeployments();
      } else {
        toast.error(res.data.message || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const formatTime = (ts: number) => ts ? new Date(ts * 1000).toLocaleString() : '-';

  if (settings && !settings.can_connect) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Server className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">模型部署</h1><p className="text-sm text-muted-foreground">管理模型部署实例</p></div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-12 text-center">
          <p className="text-slate-500">io.net 模型部署未启用或未配置 API Key，请在系统设置中配置。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Server className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">模型部署</h1><p className="text-sm text-muted-foreground">管理模型部署实例</p></div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchDeployments} disabled={loading}><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="搜索部署..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-11" />
      </div>

      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : deployments.length === 0 ? (
          <div className="text-center py-20 text-slate-400">暂无部署</div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              {['部署名称','硬件','状态','剩余时间','进度','创建时间','操作'].map(h => <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>)}
            </tr></thead>
            <tbody>{deployments.map(d => (
              <tr key={d.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                <td className="px-6 py-4 font-medium">{d.deployment_name}</td>
                <td className="px-6 py-4 text-sm">{d.hardware_info}</td>
                <td className="px-6 py-4"><Badge className={statusStyles[d.status] || 'bg-slate-50 text-slate-500 border-slate-200'}>{statusLabels[d.status] || d.status}</Badge></td>
                <td className="px-6 py-4 text-sm">{d.time_remaining}</td>
                <td className="px-6 py-4 text-sm">{d.completed_percent}%</td>
                <td className="px-6 py-4 text-sm text-slate-500">{formatTime(d.created_at)}</td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(d)}><Trash2 className="size-4 text-red-500" /></Button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="py-4 text-sm text-slate-600">确定要删除部署 <span className="font-bold">{deleteTarget?.deployment_name}</span> 吗？此操作不可撤销。</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold">
              {deleting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
