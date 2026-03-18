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
    <aside className="fixed z-20 flex h-full w-72 flex-col overflow-hidden border-r border-primary/10 bg-[#fff8f5]">
      <div className="flex shrink-0 items-center gap-3.5 px-6 py-7">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(242,107,72,0.18)]">
          <Zap className="size-5" />
        </div>
        <h1 className="text-[1.05rem] font-semibold tracking-tight text-foreground">Ogog AI</h1>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-2">
        <nav className="space-y-7">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.adminOnly || isAdmin
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                {group.separator && <Separator className="mb-6 bg-primary/8" />}
                <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
                  {group.title}
                </p>
                <ul className="space-y-1.5">
                  {visibleItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/console'}
                        className={({ isActive }) =>
                          cn(
                            'group/link flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-all',
                            isActive
                              ? 'bg-primary text-white shadow-[0_10px_22px_rgba(242,107,72,0.18)]'
                              : 'text-muted-foreground hover:bg-[#fff1e9] hover:text-foreground'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              className={cn(
                                'size-5 shrink-0 transition-colors',
                                isActive ? 'text-white' : 'text-muted-foreground group-hover/link:text-primary',
                              )}
                            />
                            <span className={cn('truncate', isActive ? 'text-white' : 'text-foreground/90')}>
                              {item.label}
                            </span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="flex-shrink-0">
        <Separator className="bg-primary/8" />
        <UserMenu />
      </div>
    </aside>
  );
}
