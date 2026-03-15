import { useState } from 'react';
import {
  Radio, Plus, Search, Pencil, Trash2, Copy, Power, PlayCircle,
  ChevronLeft, ChevronRight, CheckCheck, X, ChevronDown, Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

// ── Channel type definitions ──
const CHANNEL_TYPES = [
  { value: 1, label: 'OpenAI' },
  { value: 14, label: 'Anthropic Claude' },
  { value: 33, label: 'AWS Claude' },
  { value: 24, label: 'Google Gemini' },
  { value: 3, label: 'Azure OpenAI' },
  { value: 41, label: 'Vertex AI' },
  { value: 43, label: 'DeepSeek' },
  { value: 20, label: 'OpenRouter' },
  { value: 4, label: 'Ollama' },
  { value: 42, label: 'Mistral AI' },
  { value: 34, label: 'Cohere' },
  { value: 27, label: 'Perplexity' },
  { value: 48, label: 'xAI' },
  { value: 40, label: 'SiliconCloud' },
  { value: 25, label: 'Moonshot' },
  { value: 17, label: '阿里通义千问' },
  { value: 26, label: '智谱 GLM-4V' },
  { value: 45, label: '字节火山方舟' },
  { value: 35, label: 'MiniMax' },
  { value: 23, label: '腾讯混元' },
  { value: 15, label: '百度文心千帆' },
  { value: 8, label: '自定义渠道' },
] as const;

const typeMap = Object.fromEntries(CHANNEL_TYPES.map(t => [t.value, t.label]));

// ── Types ──
interface Channel {
  id: number; name: string; type: number; status: number;
  key: string; base_url: string; models: string; group: string;
  priority: number; weight: number; balance: number;
  response_time: number; tags: string[];
}

// ── Mock data ──
const MOCK: Channel[] = [
  { id: 1, name: 'OpenAI 主力', type: 1, status: 1, key: 'sk-xxx', base_url: 'https://api.openai.com', models: 'gpt-4o,gpt-4o-mini,o1-pro', group: 'default,vip', priority: 10, weight: 5, balance: 128.5, response_time: 320, tags: ['主力', '稳定'] },
  { id: 2, name: 'Claude Sonnet', type: 14, status: 1, key: 'sk-ant-xxx', base_url: 'https://api.anthropic.com', models: 'claude-sonnet-4-20250514,claude-3.5-sonnet', group: 'default', priority: 8, weight: 3, balance: 56.2, response_time: 450, tags: ['备用'] },
  { id: 3, name: 'Gemini Pro', type: 24, status: 1, key: 'AIza-xxx', base_url: '', models: 'gemini-2.5-pro,gemini-2.0-flash', group: 'default', priority: 5, weight: 2, balance: 0, response_time: 280, tags: [] },
  { id: 4, name: 'Azure GPT-4', type: 3, status: 2, key: 'xxx', base_url: 'https://myres.openai.azure.com', models: 'gpt-4,gpt-4-turbo', group: 'vip', priority: 10, weight: 4, balance: 200, response_time: 0, tags: ['Azure'] },
  { id: 5, name: 'DeepSeek V3', type: 43, status: 1, key: 'sk-ds-xxx', base_url: 'https://api.deepseek.com', models: 'deepseek-chat,deepseek-reasoner', group: 'default', priority: 6, weight: 3, balance: 42.8, response_time: 190, tags: ['便宜'] },
  { id: 6, name: 'AWS Bedrock', type: 33, status: 1, key: 'AKIA-xxx', base_url: '', models: 'claude-sonnet-4-20250514', group: 'vip', priority: 9, weight: 5, balance: 0, response_time: 520, tags: ['AWS'] },
  { id: 7, name: '通义千问', type: 17, status: 3, key: 'sk-qw-xxx', base_url: '', models: 'qwen-max,qwen-plus', group: 'default', priority: 4, weight: 2, balance: 15.3, response_time: 0, tags: [] },
  { id: 8, name: 'Moonshot', type: 25, status: 1, key: 'sk-ms-xxx', base_url: '', models: 'moonshot-v1-128k', group: 'default', priority: 3, weight: 1, balance: 8.0, response_time: 600, tags: [] },
];

// ── Helpers ──
function statusBadge(status: number, responseTime: number) {
  if (status === 1) return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
      <span className="size-1.5 rounded-full bg-emerald-500" />已启用
      {responseTime > 0 && <span className="text-emerald-400 font-normal">{responseTime}ms</span>}
    </span>
  );
  if (status === 2) return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
      <span className="size-1.5 rounded-full bg-slate-400" />已禁用
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-500">
      <span className="size-1.5 rounded-full bg-red-500" />错误
    </span>
  );
}

const emptyForm = {
  name: '', type: 1, base_url: '', key: '', models: '',
  group: 'default', priority: 0, weight: 0, tags: '',
};

// ── Component ──
export default function ChannelPage() {
  const [channels] = useState<Channel[]>(MOCK);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [testingId, setTestingId] = useState<number | null>(null);

  const perPage = 10;
  const filtered = channels.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === 'enabled' && c.status !== 1) return false;
    if (statusFilter === 'disabled' && c.status !== 1) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);
  const allSelected = pageItems.length > 0 && pageItems.every(c => selected.has(c.id));

  const toggleSelect = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(pageItems.map(c => c.id)));
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Channel) => {
    setEditId(c.id);
    setForm({ name: c.name, type: c.type, base_url: c.base_url, key: c.key, models: c.models, group: c.group, priority: c.priority, weight: c.weight, tags: c.tags.join(',') });
    setDialogOpen(true);
  };
  const handleTest = (id: number) => { setTestingId(id); setTimeout(() => setTestingId(null), 1500); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Radio className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">渠道管理</h1><p className="text-sm text-muted-foreground">管理上游 AI 服务渠道</p></div>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto">
          <Plus className="size-4 mr-1.5" />添加渠道
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索渠道名称..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-11" />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-2xl p-1">
          {([['all', '全部'], ['enabled', '已启用'], ['disabled', '已禁用']] as const).map(([v, l]) => (
            <button key={v} onClick={() => { setStatusFilter(v); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === v ? 'bg-white text-foreground shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
          ))}
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1); }}
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
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8"><Power className="size-3.5 mr-1" />批量启用</Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8"><X className="size-3.5 mr-1" />批量禁用</Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8"><Zap className="size-3.5 mr-1" />批量测试</Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="size-3.5 mr-1" />批量删除</Button>
            <button onClick={() => setSelected(new Set())} className="size-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 inline-flex items-center justify-center"><X className="size-4" /></button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-4 py-4 w-10"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 rounded accent-primary" /></th>
            {['ID','名称','类型','状态','余额','优先级','权重','操作'].map(h => (
              <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {pageItems.map(c => (
              <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${selected.has(c.id) ? 'bg-primary/[0.02]' : ''}`}>
                <td className="px-4 py-4"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="size-4 rounded accent-primary" /></td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{c.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    {c.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{typeMap[c.type] || `Type ${c.type}`}</td>
                <td className="px-6 py-4">{statusBadge(c.status, c.response_time)}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{c.balance > 0 ? `$${c.balance.toFixed(2)}` : '-'}</td>
                <td className="px-6 py-4 text-sm font-medium">{c.priority}</td>
                <td className="px-6 py-4 text-sm font-medium">{c.weight}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleTest(c.id)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title="测试">
                      {testingId === c.id ? <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <PlayCircle className="size-4" />}
                    </button>
                    <button onClick={() => openEdit(c)} className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title="编辑"><Pencil className="size-4" /></button>
                    <button className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title="复制"><Copy className="size-4" /></button>
                    <button className="size-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all inline-flex items-center justify-center" title={c.status === 1 ? '禁用' : '启用'}>
                      <Power className={`size-4 ${c.status === 1 ? '' : 'text-emerald-500'}`} />
                    </button>
                    <button className="size-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all inline-flex items-center justify-center" title="删除"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {filtered.length} 条渠道</p>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="size-9 rounded-xl border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:text-foreground disabled:opacity-40"><ChevronRight className="size-4" /></button>
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
            {/* Group */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">分组</label>
              <Input value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} placeholder="default" />
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
            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">标签 <span className="text-slate-400 font-normal">(逗号分隔)</span></label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="主力,稳定" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose>
            <Button onClick={() => setDialogOpen(false)} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20">{editId ? '保存' : '添加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


