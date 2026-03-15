import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="h-20 border-b border-border flex items-center justify-between px-10 sticky top-0 bg-background/80 backdrop-blur-xl z-10">
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">控制台</span>
        </nav>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors size-5" />
          <input
            className="h-10 w-72 bg-card border border-input rounded-xl pl-11 pr-4 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
            placeholder="搜索..."
            type="text"
          />
        </div>
        <Button variant="outline" size="icon" className="size-10 rounded-xl">
          <Bell className="size-[22px]" />
        </Button>
      </div>
    </header>
  );
}
