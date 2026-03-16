import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-12 text-center max-w-md">
        <div className="size-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="size-10 text-amber-400" />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-lg text-slate-500 mb-8">页面未找到，请检查您的浏览器地址是否正确</p>
        <Link to="/">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold px-6 py-2.5 h-auto">
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
