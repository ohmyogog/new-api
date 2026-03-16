import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

export default function UserAgreementPage() {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('user_agreement');
    if (cached) setContent(cached);

    API.get('/api/user-agreement')
      .then((res) => {
        const { success, message, data } = res.data;
        if (success && data) {
          setContent(data);
          localStorage.setItem('user_agreement', data);
        } else if (!success) {
          toast.error(message || '加载失败');
        }
      })
      .catch(() => toast.error('加载用户协议内容失败'))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded && !content) {
    return (
      <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">加载中...</div>
      </div>
    );
  }

  if (loaded && !content) {
    return (
      <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl border border-slate-100 soft-shadow p-12 text-center max-w-lg">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">用户协议</h2>
          <p className="text-sm text-slate-500">暂无用户协议内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f5] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 soft-shadow p-8 md:p-12">
        <h1 className="text-2xl font-bold mb-8">用户协议</h1>
        <div
          className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
