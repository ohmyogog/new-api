import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronsUpDown, LogOut, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { API } from '@/api/client';

export function UserMenu() {
  const navigate = useNavigate();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const handleLogout = async () => {
    try {
      await API.get('/api/user/logout', { skipErrorHandler: true } as never);
    } catch { /* ignore */ }
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="p-5">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 p-3 rounded-2xl bg-muted border border-border shadow-sm w-full hover:bg-accent transition-all cursor-pointer">
          <Avatar className="size-10 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden text-left">
            <p className="text-sm font-bold text-foreground truncate">{user.username || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.role >= 10 ? '管理员' : '用户'}
            </p>
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => navigate('/console/personal')}>
            <UserCircle className="mr-2 size-4" /> 个人设置
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 size-4" /> 退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
