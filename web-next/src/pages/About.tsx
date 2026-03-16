import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { API } from '@/api/client';
import toast from 'react-hot-toast';

export default function AboutPage() {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('about');
    if (cached) setContent(cached);

    API.get('/api/about')
      .then((res) => {
        const { success, message, data } = res.data;
        if (success && data) {
          const html = data.startsWith('https://') ? data : data;
          setContent(html);
          localStorage.setItem('about', html);
        } else if (!success) {
          toast.error(message || '加载失败');
        }
      })
      .catch(() => toast.error('加载关于内容失败'))
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
            <Info className="size-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">暂无关于内容</h2>
          <p className="text-sm text-slate-500">管理员暂时未设置任何关于内容</p>
        </div>
      </div>
    );
  }

  if (content.startsWith('https://')) {
    return (
      <div className="min-h-screen bg-[#fcf9f5]">
        <iframe src={content} className="w-full h-screen border-none" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f5] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 soft-shadow p-8 md:p-12">
        <div
          className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
