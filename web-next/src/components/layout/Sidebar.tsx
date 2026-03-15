import { NavLink } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard, Key, BarChart3, Image, CheckSquare,
  Wallet, UserCircle, Layers, CalendarClock, Box, Container,
  Grid3X3, Users, Settings, Zap, SquarePen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  separator?: boolean; // show separator before this group
}

const navGroups: NavGroup[] = [
  {
    title: '聊天',
    items: [
      { label: '操练场', to: '/console/playground', icon: SquarePen },
    ],
  },
  {
    title: '控制台',
    separator: true,
    items: [
      { label: '数据看板', to: '/console', icon: LayoutDashboard },
      { label: '令牌管理', to: '/console/token', icon: Key },
      { label: '使用日志', to: '/console/log', icon: BarChart3 },
      { label: '绘图日志', to: '/console/midjourney', icon: Image },
      { label: '任务日志', to: '/console/task', icon: CheckSquare },
    ],
  },
  {
    title: '个人中心',
    separator: true,
    items: [
      { label: '钱包管理', to: '/console/topup', icon: Wallet },
      { label: '个人设置', to: '/console/personal', icon: UserCircle },
    ],
  },
  {
    title: '管理员',
    separator: true,
    items: [
      { label: '渠道管理', to: '/console/channel', icon: Layers, adminOnly: true },
      { label: '订阅管理', to: '/console/subscription', icon: CalendarClock, adminOnly: true },
      { label: '模型管理', to: '/console/models', icon: Box, adminOnly: true },
      { label: '模型部署', to: '/console/deployment', icon: Container, adminOnly: true },
      { label: '兑换码管理', to: '/console/redemption', icon: Grid3X3, adminOnly: true },
      { label: '用户管理', to: '/console/user', icon: Users, adminOnly: true },
      { label: '系统设置', to: '/console/setting', icon: Settings, adminOnly: true },
    ],
  },
];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function Sidebar() {
  const user = getUser();
  const isAdmin = user && typeof user.role === 'number' && user.role >= 10;

  return (
    <aside className="w-72 border-r border-border flex flex-col fixed h-full bg-sidebar backdrop-blur-xl z-20">
      <div className="p-8 flex items-center gap-3">
        <div className="size-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Zap className="size-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Ogog AI</h1>
      </div>

      <ScrollArea className="flex-1 px-5 py-2">
        <nav className="space-y-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.adminOnly || isAdmin
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                {group.separator && <Separator className="mb-6" />}
                <p className="px-3 mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {group.title}
                </p>
                <ul className="space-y-1">
                  {visibleItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/console'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-muted transition-all group',
                            isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                          )
                        }
                      >
                        <item.icon className="size-[22px] group-hover:text-primary transition-colors" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />
      <UserMenu />
    </aside>
  );
}
