import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Pencil,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldOff,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

// --- Types ---

interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  group: string;
  quota: number;
  used_quota: number;
  role: number;
  status: number;
  request_count: number;
  aff_code: string;
  inviter_id: number;
  created_time: number;
}

// --- Helpers ---

const PAGE_SIZE = 20;

const fmtQuota = (q: number) => (q === -1 ? '无限' : `$${(q / 500000).toFixed(2)}`);

const roleLabels: Record<number, string> = { 100: '超级管理员', 10: '管理员', 1: '普通用户' };
const roleStyles: Record<number, string> = {
  100: 'bg-orange-50 text-orange-600 border-orange-200',
  10: 'bg-primary/10 text-primary border-primary/20',
  1: 'bg-slate-50 text-slate-600 border-slate-200',
};

const fmtTime = (ts: number) => {
  if (!ts) return '-';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// --- Component ---

export default function UserPage() {
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    display_name: '',
    password: '',
    group: 'default',
    quota: 0,
  });

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ label: string; onConfirm: () => void }>({
    label: '',
    onConfirm: () => {},
  });

  // --- API calls ---

  const loadUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/user/?p=${p}&page_size=${PAGE_SIZE}`);
      const { success, message, data } = res.data;
      if (success) {
        setUsers(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || p);
      } else {
        toast.error(message || '加载用户失败');
      }
    } catch {
      toast.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (keyword: string, p: number) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/user/search?keyword=${encodeURIComponent(keyword)}&p=${p}&page_size=${PAGE_SIZE}`);
      const { success, message, data } = res.data;
      if (success) {
        setUsers(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || p);
      } else {
        toast.error(message || '搜索失败');
      }
    } catch {
      toast.error('搜索失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback((p?: number) => {
    const targetPage = p ?? page;
    if (searchActive && search) {
      searchUsers(search, targetPage);
    } else {
      loadUsers(targetPage);
    }
  }, [page, search, searchActive, loadUsers, searchUsers]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  // Search handler
  const handleSearch = () => {
    if (search.trim()) {
      setSearchActive(true);
      searchUsers(search.trim(), 1);
    } else {
      setSearchActive(false);
      loadUsers(1);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    if (searchActive && search) {
      searchUsers(search, p);
    } else {
      loadUsers(p);
    }
  };

  // --- User actions ---

  const manageUser = async (id: number, action: string) => {
    try {
      const res = await API.post('/api/user/manage', { id, action });
      const { success, message, data } = res.data;
      if (success) {
        toast.success('操作成功');
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: data.status, role: data.role } : u,
          ),
        );
      } else {
        toast.error(message || '操作失败');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const res = await API.post('/api/user/manage', { id, action: 'delete' });
      const { success, message } = res.data;
      if (success) {
        toast.success('用户已删除');
        refresh();
      } else {
        toast.error(message || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const openConfirm = (label: string, onConfirm: () => void) => {
    setConfirmAction({ label, onConfirm });
    setConfirmOpen(true);
  };

  // --- Create / Edit ---

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', display_name: '', password: '', group: 'default', quota: 0 });
    setDialogOpen(true);
  };

  const openEdit = async (u: User) => {
    setEditUser(u);
    // Load fresh user data
    try {
      const res = await API.get(`/api/user/${u.id}`);
      const { success, data } = res.data;
      if (success) {
        setForm({
          username: data.username || '',
          display_name: data.display_name || '',
          password: '',
          group: data.group || 'default',
          quota: data.quota ?? 0,
        });
      } else {
        setForm({
          username: u.username || '',
          display_name: u.display_name || '',
          password: '',
          group: u.group || 'default',
          quota: u.quota ?? 0,
        });
      }
    } catch {
      setForm({
        username: u.username || '',
        display_name: u.display_name || '',
        password: '',
        group: u.group || 'default',
        quota: u.quota ?? 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    if (!editUser && !form.password) {
      toast.error('请输入密码');
      return;
    }
    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (editUser) {
        payload.id = editUser.id;
        if (!payload.password) delete payload.password;
        const res = await API.put('/api/user/', payload);
        const { success, message } = res.data;
        if (success) {
          toast.success('用户更新成功');
          setDialogOpen(false);
          refresh();
        } else {
          toast.error(message || '更新失败');
        }
      } else {
        const res = await API.post('/api/user/', payload);
        const { success, message } = res.data;
        if (success) {
          toast.success('用户创建成功');
          setDialogOpen(false);
          refresh(1);
        } else {
          toast.error(message || '创建失败');
        }
      }
    } catch {
      toast.error('保存失败');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Render ---

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">用户管理</h1>
            <p className="text-sm text-muted-foreground">管理系统用户</p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="size-4 mr-1.5" />
          添加用户
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户名或邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-11"
          />
        </div>
        <Button variant="outline" className="rounded-2xl font-bold" onClick={handleSearch}>
          搜索
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-100 rounded-3xl soft-shadow">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Users className="size-10 mb-2 opacity-30" />
            <span className="text-sm">暂无用户数据</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {['ID', '用户名', '邮箱', '分组', '剩余额度', '已用额度', '角色', '状态', '创建时间', '操作'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-left whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm">{u.id}</td>
                    <td className="px-6 py-4 font-medium">
                      {u.display_name || u.username}
                      {u.display_name && u.display_name !== u.username && (
                        <span className="text-xs text-slate-400 ml-1">({u.username})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.email || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{u.group || 'default'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">{fmtQuota(u.quota)}</td>
                    <td className="px-6 py-4 text-sm">{fmtQuota(u.used_quota)}</td>
                    <td className="px-6 py-4">
                      <Badge className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${roleStyles[u.role] || roleStyles[1]}`}>
                        {roleLabels[u.role] || '用户'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                          u.status === 1
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-red-50 text-red-500 border-red-200'
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${u.status === 1 ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        {u.status === 1 ? '正常' : '封禁'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{fmtTime(u.created_time)}</td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className="size-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.status === 1 ? (
                            <DropdownMenuItem onClick={() => openConfirm(`禁用用户 ${u.username}？`, () => manageUser(u.id, 'disable'))}>
                              <ToggleLeft className="size-4 mr-2" />
                              禁用
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => manageUser(u.id, 'enable')}>
                              <ToggleRight className="size-4 mr-2" />
                              启用
                            </DropdownMenuItem>
                          )}
                          {u.role === 1 ? (
                            <DropdownMenuItem onClick={() => openConfirm(`提升 ${u.username} 为管理员？`, () => manageUser(u.id, 'promote'))}>
                              <ShieldCheck className="size-4 mr-2" />
                              提升为管理员
                            </DropdownMenuItem>
                          ) : u.role === 10 ? (
                            <DropdownMenuItem onClick={() => openConfirm(`降级 ${u.username} 为普通用户？`, () => manageUser(u.id, 'demote'))}>
                              <ShieldOff className="size-4 mr-2" />
                              降级为普通用户
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => openConfirm(`确定删除用户 ${u.username}？此操作不可撤销。`, () => deleteUser(u.id))}
                          >
                            <Trash2 className="size-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-xl"
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon"
                  className={`size-8 rounded-xl text-xs ${p === page ? 'bg-primary text-white' : ''}`}
                  onClick={() => goPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-xl"
              disabled={page >= totalPages}
              onClick={() => goPage(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editUser ? `编辑用户 - ${editUser.username}` : '添加用户'}</DialogTitle>
            <DialogDescription>
              {editUser ? '修改用户信息，留空密码则不修改' : '创建新用户账户'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                用户名
              </Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="请输入用户名"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                显示名称
              </Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="请输入显示名称"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                密码{editUser ? '（留空不修改）' : ''}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editUser ? '留空则不修改密码' : '请输入密码（最短8位）'}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                分组
              </Label>
              <Input
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                placeholder="请输入分组"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm"
              />
            </div>
            {editUser && (
              <div>
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                  额度（{fmtQuota(form.quota)}）
                </Label>
                <Input
                  type="number"
                  value={form.quota}
                  onChange={(e) => setForm({ ...form, quota: parseInt(e.target.value) || 0 })}
                  step={500000}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-2xl">
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={formLoading}
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
            >
              {formLoading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              {editUser ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
            <DialogDescription>{confirmAction.label}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-2xl">
                取消
              </Button>
            </DialogClose>
            <Button
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
              onClick={() => {
                confirmAction.onConfirm();
                setConfirmOpen(false);
              }}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
