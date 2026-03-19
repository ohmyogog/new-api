import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: '控制台',
    to: '/console',
    isActive: (pathname: string) => pathname.startsWith('/console'),
  },
  {
    label: '模型广场',
    to: '/pricing',
    isActive: (pathname: string) => pathname.startsWith('/pricing'),
  },
] as const;

export function TopPrimaryNav({ className }: { className?: string }) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/10 bg-[#fff2ea]/90 p-1 shadow-[0_12px_28px_rgba(242,107,72,0.08)]',
        className,
      )}
      aria-label="Primary navigation"
    >
      {navItems.map((item) => {
        const active = item.isActive(location.pathname);

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-all',
              active
                ? 'bg-white text-primary shadow-[0_10px_20px_rgba(242,107,72,0.12)]'
                : 'text-muted-foreground hover:bg-white/80 hover:text-foreground',
            )}
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
