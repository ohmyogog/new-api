import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-12 text-center max-w-md">
        <div className="size-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="size-10 text-red-400" />
        </div>
        <h1 className="text-4xl font-bold mb-2">403</h1>
        <p className="text-lg text-slate-500 mb-8">您无权访问此页面</p>
        <Link to="/">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold px-6 py-2.5 h-auto">
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
