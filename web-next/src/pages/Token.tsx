import { useState } from 'react';
import {
  Key, Plus, Search, Copy, Check, Power, Pencil, Trash2,
  ChevronLeft, ChevronRight, X, Eye, EyeOff,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

// ── Types ──
interface Token {
  id: number; name: string; status: number; key: string;
  used_quota: number; remain_quota: number;
  created_time: number; expired_time: number;
  unlimited_quota: boolean; models?: string; subnet?: string;
}

// ── Mock data ──
const now = Math.floor(Date.now() / 1000);
const mockTokens: Token[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1, name: `Token-${i + 1}`, status: i % 3 === 2 ? 2 : 1,
  key: `sk-xxxx...${String(i + 1).padStart(4, '0')}`,
  used_quota: Math.floor(Math.random() * 50000),
  remain_quota: i % 2 === 0 ? -1 : Math.floor(Math.random() * 100000),
  created_time: now - 86400 * (8 - i), expired_time: i % 4 === 0 ? -1 : now + 86400 * 30,
  unlimited_quota: i % 2 === 0,
}));

function fmtQuota(q: number) {
  if (q === -1) return '无限';
  return `$${(q / 500000).toFixed(2)}`;
}
function fmtTime(t: number) {
  if (t <= 0) return '永不过期';
  return new Date(t * 1000).toLocaleString('zh-CN');
}

const emptyForm = { name: '', remain_quota: 500000, unlimited_quota: true, expired_time: -1, models: '', subnet: '' };

export default function TokenPage() {
  const [tokens] = useState<Token[]>(mockTokens);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const perPage = 10;
  const filtered = tokens.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageTokens = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: Token) => {
    setEditId(t.id);
    setForm({ name: t.name, remain_quota: t.remain_quota, unlimited_quota: t.unlimited_quota, expired_time: t.expired_time, models: t.models || '', subnet: t.subnet || '' });
    setDialogOpen(true);
  };
  const handleCopy = (id: number) => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Key className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">令牌管理</h1><p className="text-sm text-muted-foreground">管理你的 API 令牌</p></div>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto">
          <Plus className="size-4 mr-1.5" />创建令牌
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="搜索令牌名称..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-11" />
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['名称','状态','已用额度','剩余额度','创建时间','过期时间','操作'].map(h => (
              <th key={h} className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {pageTokens.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 text-sm font-medium">{t.name}</td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${t.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`size-1.5 rounded-full ${t.status === 1 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {t.status === 1 ? '已启用' : '已禁用'}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-muted-foreground">{fmtQuota(t.used_quota)}</td>
                <td className="px-8 py-5 text-sm text-muted-foreground">{t.unlimited_quota ? '无限' : fmtQuota(t.remain_quota)}</td>
                <td className="px-8 py-5 text-sm text-muted-foreground">{fmtTime(t.created_time)}</td>
                <td className="px-8 py-5 text-sm text-muted-foreground">{fmtTime(t.expired_time)}</td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCopy(t.id)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center">
                      {copiedId === t.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                    <button className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center">
                      {t.status === 1 ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <button onClick={() => openEdit(t)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center">
                      <Pencil className="size-4" />
                    </button>
                    <button className="size-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all inline-flex items-center justify-center">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editId ? '编辑令牌' : '创建令牌'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium mb-1.5 block">名称</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="输入令牌名称" /></div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">无限额度</label>
              <button onClick={() => setForm(f => ({ ...f, unlimited_quota: !f.unlimited_quota }))} className={`w-11 h-6 rounded-full transition-colors relative ${form.unlimited_quota ? 'bg-primary' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${form.unlimited_quota ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {!form.unlimited_quota && (
              <div><label className="text-sm font-medium mb-1.5 block">额度</label><Input type="number" value={form.remain_quota} onChange={e => setForm(f => ({ ...f, remain_quota: Number(e.target.value) }))} /></div>
            )}
            <div><label className="text-sm font-medium mb-1.5 block">模型限制 (逗号分隔，留空不限)</label><Input value={form.models} onChange={e => setForm(f => ({ ...f, models: e.target.value }))} placeholder="gpt-4o, claude-3-opus" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">IP 限制 (CIDR，留空不限)</label><Input value={form.subnet} onChange={e => setForm(f => ({ ...f, subnet: e.target.value }))} placeholder="192.168.1.0/24" /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={() => setDialogOpen(false)} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20">{editId ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
