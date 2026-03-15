import { useState } from 'react';
import { Ticket, Plus, Search, Trash2, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface Code { id: number; code: string; quota: number; status: 'unused'|'used'|'disabled'; usedBy: string; createdAt: string; }

const mockCodes: Code[] = [
  { id: 1, code: 'REDM-****-A1B2', quota: 100000, status: 'unused', usedBy: '-', createdAt: '2026-01-15' },
  { id: 2, code: 'REDM-****-C3D4', quota: 500000, status: 'used', usedBy: 'alice', createdAt: '2026-01-15' },
  { id: 3, code: 'REDM-****-E5F6', quota: 100000, status: 'used', usedBy: 'bob', createdAt: '2026-02-01' },
  { id: 4, code: 'REDM-****-G7H8', quota: 1000000, status: 'disabled', usedBy: '-', createdAt: '2026-02-10' },
  { id: 5, code: 'REDM-****-I9J0', quota: 500000, status: 'unused', usedBy: '-', createdAt: '2026-03-01' },
];

const statusStyles: Record<string,string> = { unused: 'bg-emerald-50 text-emerald-600 border-emerald-200', used: 'bg-slate-50 text-slate-500 border-slate-200', disabled: 'bg-red-50 text-red-500 border-red-200' };
const statusLabels: Record<string,string> = { unused: '未使用', used: '已使用', disabled: '已禁用' };

export default function RedemptionPage() {
  const [codes] = useState<Code[]>(mockCodes);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchCount, setBatchCount] = useState(10);
  const [batchQuota, setBatchQuota] = useState(100000);
  const [copiedId, setCopiedId] = useState<number|null>(null);

  const filtered = codes.filter(c => c.code.includes(search) || c.usedBy.includes(search));
  const handleCopy = (id: number) => { setCopiedId(id); setTimeout(()=>setCopiedId(null), 2000); };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Ticket className="size-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">兑换码管理</h1><p className="text-sm text-muted-foreground">创建和管理兑换码</p></div>
        </div>
        <Button onClick={()=>setDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 px-5 py-2.5 h-auto"><Plus className="size-4 mr-1.5" />批量创建</Button>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="搜索兑换码..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-11" /></div>

      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['ID','兑换码','额度','状态','使用者','创建时间','操作'].map(h=><th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(c=>(
            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
              <td className="px-6 py-4">{c.id}</td>
              <td className="px-6 py-4 font-mono text-sm">{c.code}</td>
              <td className="px-6 py-4">${(c.quota/500000).toFixed(2)}</td>
              <td className="px-6 py-4"><Badge className={statusStyles[c.status]}>{statusLabels[c.status]}</Badge></td>
              <td className="px-6 py-4">{c.usedBy}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{c.createdAt}</td>
              <td className="px-6 py-4 flex gap-1">
                <Button variant="ghost" size="icon" onClick={()=>handleCopy(c.id)}>{copiedId===c.id?<Check className="size-4 text-emerald-500"/>:<Copy className="size-4"/>}</Button>
                <Button variant="ghost" size="icon"><Trash2 className="size-4 text-red-500" /></Button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>批量创建兑换码</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium mb-1 block">生成数量</label><Input type="number" value={batchCount} onChange={e=>setBatchCount(+e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1 block">每张额度</label><Input type="number" value={batchQuota} onChange={e=>setBatchQuota(+e.target.value)} /><p className="text-xs text-slate-400 mt-1">当前: ${(batchQuota/500000).toFixed(2)}</p></div>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose><Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">生成</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
