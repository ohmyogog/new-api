import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-72">
        <Header />
        <div className="px-6 py-6">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
                正在加载页面...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
