import { useState } from 'react';
import { Box, Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface Model { id: string; displayName: string; vendor: string; type: 'chat'|'embedding'|'image'; inputPrice: number; outputPrice: number; status: 'active'|'disabled'; }

const mockModels: Model[] = [
  { id: 'gpt-4o', displayName: 'GPT-4o', vendor: 'OpenAI', type: 'chat', inputPrice: 2.5, outputPrice: 10, status: 'active' },
  { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini', vendor: 'OpenAI', type: 'chat', inputPrice: 0.15, outputPrice: 0.6, status: 'active' },
  { id: 'claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet', vendor: 'Anthropic', type: 'chat', inputPrice: 3, outputPrice: 15, status: 'active' },
  { id: 'claude-3-haiku', displayName: 'Claude 3 Haiku', vendor: 'Anthropic', type: 'chat', inputPrice: 0.25, outputPrice: 1.25, status: 'active' },
  { id: 'gemini-pro', displayName: 'Gemini Pro', vendor: 'Google', type: 'chat', inputPrice: 0.5, outputPrice: 1.5, status: 'active' },
  { id: 'text-embedding-3-large', displayName: 'Embedding 3 Large', vendor: 'OpenAI', type: 'embedding', inputPrice: 0.13, outputPrice: 0, status: 'active' },
  { id: 'dall-e-3', displayName: 'DALL-E 3', vendor: 'OpenAI', type: 'image', inputPrice: 40, outputPrice: 0, status: 'disabled' },
];

const typeColors: Record<string,string> = { chat: 'bg-blue-50 text-blue-600 border-blue-200', embedding: 'bg-purple-50 text-purple-600 border-purple-200', image: 'bg-amber-50 text-amber-600 border-amber-200' };
const typeLabels: Record<string,string> = { chat: '对话', embedding: '向量', image: '图像' };
const emptyForm = { id: '', displayName: '', vendor: '', type: 'chat' as const, inputPrice: 0, outputPrice: 0 };

export default function ModelPage() {
  const [models] = useState<Model[]>(mockModels);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = models.filter(m => m.id.includes(search) || m.displayName.toLowerCase().includes(search.toLowerCase()));
  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: Model) => { setEditId(m.id); setForm({ id: m.id, displayName: m.displayName, vendor: m.vendor, type: m.type, inputPrice: m.inputPrice, outputPrice: m.outputPrice }); setDialogOpen(true); };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Box className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">模型管理</h1><p className="text-sm text-muted-foreground">管理可用模型与定价</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl font-bold px-5 py-2.5 h-auto"><RefreshCw className="size-4 mr-1.5" />同步上游</Button>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto"><Plus className="size-4 mr-1.5" />添加模型</Button>
        </div>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="搜索模型..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-11" /></div>

      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['模型 ID','显示名称','厂商','类型','输入价格','输出价格','状态','操作'].map(h=><th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(m=>(
            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
              <td className="px-6 py-4 font-mono text-sm">{m.id}</td>
              <td className="px-6 py-4 font-medium">{m.displayName}</td>
              <td className="px-6 py-4">{m.vendor}</td>
              <td className="px-6 py-4"><Badge className={typeColors[m.type]}>{typeLabels[m.type]}</Badge></td>
              <td className="px-6 py-4">${m.inputPrice}/M</td>
              <td className="px-6 py-4">${m.outputPrice}/M</td>
              <td className="px-6 py-4"><Badge className={m.status==='active'?'bg-emerald-50 text-emerald-600 border-emerald-200':'bg-slate-50 text-slate-500 border-slate-200'}>{m.status==='active'?'启用':'停用'}</Badge></td>
              <td className="px-6 py-4 flex gap-1">
                <Button variant="ghost" size="icon" onClick={()=>openEdit(m)}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon"><Trash2 className="size-4 text-red-500" /></Button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>{editId?'编辑模型':'添加模型'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium mb-1 block">模型 ID</label><Input value={form.id} onChange={e=>setForm({...form,id:e.target.value})} disabled={!!editId} /></div>
            <div><label className="text-sm font-medium mb-1 block">显示名称</label><Input value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">厂商</label><Input value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})} /></div>
              <div><label className="text-sm font-medium mb-1 block">类型</label>
                <select value={form.type} onChange={e=>setForm({...form,type:e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm">
                  <option value="chat">对话</option><option value="embedding">向量</option><option value="image">图像</option>
                </select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">输入价格 ($/M tokens)</label><Input type="number" value={form.inputPrice} onChange={e=>setForm({...form,inputPrice:+e.target.value})} /></div>
              <div><label className="text-sm font-medium mb-1 block">输出价格 ($/M tokens)</label><Input type="number" value={form.outputPrice} onChange={e=>setForm({...form,outputPrice:+e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose><Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
