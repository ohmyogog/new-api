import { useState } from 'react';
import { Users, Search, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface User { id: number; username: string; email: string; group: string; quota: number; usedQuota: number; role: number; status: number; createdAt: string; }

const mockUsers: User[] = [
  { id: 1, username: 'admin', email: 'admin@example.com', group: 'default', quota: -1, usedQuota: 1250000, role: 100, status: 1, createdAt: '2025-06-01' },
  { id: 2, username: 'alice', email: 'alice@example.com', group: 'vip', quota: 5000000, usedQuota: 320000, role: 1, status: 1, createdAt: '2025-08-15' },
  { id: 3, username: 'bob', email: 'bob@example.com', group: 'default', quota: 1000000, usedQuota: 980000, role: 1, status: 1, createdAt: '2025-09-20' },
  { id: 4, username: 'charlie', email: 'charlie@example.com', group: 'default', quota: 500000, usedQuota: 0, role: 1, status: 2, createdAt: '2026-01-05' },
  { id: 5, username: 'diana', email: 'diana@example.com', group: 'vip', quota: 10000000, usedQuota: 4500000, role: 1, status: 1, createdAt: '2026-02-14' },
];

const fmtQuota = (q: number) => q === -1 ? '无限' : `$${(q/500000).toFixed(2)}`;
const roleLabels: Record<number,string> = { 100: '管理员', 1: '普通用户' };
const roleStyles: Record<number,string> = { 100: 'bg-primary/10 text-primary border-primary/20', 1: 'bg-slate-50 text-slate-600 border-slate-200' };

export default function UserPage() {
  const [users] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User|null>(null);
  const [form, setForm] = useState({ role: 1, quota: 0, group: 'default', status: 1 });

  const filtered = users.filter(u => u.username.includes(search) || u.email.includes(search));
  const openEdit = (u: User) => { setEditUser(u); setForm({ role: u.role, quota: u.quota, group: u.group, status: u.status }); setDialogOpen(true); };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="size-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold">用户管理</h1><p className="text-sm text-muted-foreground">管理系统用户</p></div>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="搜索用户名或邮箱..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-11" /></div>

      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            {['ID','用户名','邮箱','分组','额度','已用额度','角色','状态','创建时间','操作'].map(h=><th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(u=>(
            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
              <td className="px-6 py-4">{u.id}</td>
              <td className="px-6 py-4 font-medium">{u.username}</td>
              <td className="px-6 py-4 text-sm">{u.email}</td>
              <td className="px-6 py-4"><Badge variant="outline">{u.group}</Badge></td>
              <td className="px-6 py-4">{fmtQuota(u.quota)}</td>
              <td className="px-6 py-4">{fmtQuota(u.usedQuota)}</td>
              <td className="px-6 py-4"><Badge className={roleStyles[u.role]||roleStyles[1]}>{roleLabels[u.role]||'用户'}</Badge></td>
              <td className="px-6 py-4"><Badge className={u.status===1?'bg-emerald-50 text-emerald-600 border-emerald-200':'bg-red-50 text-red-500 border-red-200'}>{u.status===1?'正常':'封禁'}</Badge></td>
              <td className="px-6 py-4 text-sm text-slate-500">{u.createdAt}</td>
              <td className="px-6 py-4"><Button variant="ghost" size="icon" onClick={()=>openEdit(u)}><Pencil className="size-4" /></Button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>编辑用户 - {editUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium mb-1 block">角色</label>
              <select value={form.role} onChange={e=>setForm({...form,role:+e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm">
                <option value={1}>普通用户</option><option value={100}>管理员</option>
              </select></div>
            <div><label className="text-sm font-medium mb-1 block">额度</label><Input type="number" value={form.quota} onChange={e=>setForm({...form,quota:+e.target.value})} /></div>
            <div><label className="text-sm font-medium mb-1 block">分组</label><Input value={form.group} onChange={e=>setForm({...form,group:e.target.value})} /></div>
            <div><label className="text-sm font-medium mb-1 block">状态</label>
              <select value={form.status} onChange={e=>setForm({...form,status:+e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm">
                <option value={1}>正常</option><option value={2}>封禁</option>
              </select></div>
          </div>
          <DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-2xl">取消</Button></DialogClose><Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold">保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
