import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopPrimaryNav } from './TopPrimaryNav';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-primary/8 bg-background/85 px-8 backdrop-blur-xl">
      <TopPrimaryNav />
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full border-primary/10 bg-white/80 text-muted-foreground shadow-sm hover:bg-white hover:text-primary"
        >
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
