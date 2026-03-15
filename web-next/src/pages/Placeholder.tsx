import { useLocation } from 'react-router-dom';

export function Placeholder() {
  const location = useLocation();
  return (
    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
      <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-primary text-2xl font-bold">🚧</span>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">页面建设中</h2>
      <p className="text-sm">{location.pathname}</p>
    </div>
  );
}
