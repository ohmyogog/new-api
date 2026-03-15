import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-8 sticky top-0 bg-background/80 backdrop-blur-xl z-10 flex-shrink-0">
      <div className="text-lg font-medium text-muted-foreground">控制台</div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="size-8 rounded-full">
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
