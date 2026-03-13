import React, { useContext, useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import App from '../../App';
import FooterBar from '../layout/Footer';
import { Toaster } from 'sonner';
import { ToastContainer } from 'react-toastify';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { useSidebarCollapsed } from '../../hooks/common/useSidebarCollapsed';
import { useTranslation } from 'react-i18next';
import {
  API,
  getLogo,
  getSystemName,
  showError,
  setStatusData,
} from '../../helpers';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { useLocation } from 'react-router-dom';
import { normalizeLanguage } from '../../i18n/language';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const AppLayout = () => {
  const [userState, userDispatch] = useContext(UserContext);
  const [, statusDispatch] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const [collapsed] = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { i18n } = useTranslation();
  const location = useLocation();

  const cardProPages = [
    '/console/channel', '/console/log', '/console/redemption',
    '/console/user', '/console/token', '/console/midjourney',
    '/console/task', '/console/models', '/pricing',
  ];

  const shouldHideFooter = cardProPages.includes(location.pathname);
  const shouldInnerPadding =
    location.pathname.includes('/console') &&
    !location.pathname.startsWith('/console/chat') &&
    location.pathname !== '/console/playground';
  const isConsoleRoute = location.pathname.startsWith('/console');

  const loadUser = () => {
    let user = localStorage.getItem('user');
    if (user) {
      let data = JSON.parse(user);
      userDispatch({ type: 'login', payload: data });
    }
  };

  const loadStatus = async () => {
    try {
      const res = await API.get('/api/status');
      const { success, data } = res.data;
      if (success) {
        statusDispatch({ type: 'set', payload: data });
        setStatusData(data);
      } else {
        showError('Unable to connect to server');
      }
    } catch (error) {
      showError('Failed to load status');
    }
  };

  useEffect(() => {
    loadUser();
    loadStatus().catch(console.error);
    let systemName = getSystemName();
    if (systemName) document.title = systemName;
    let logo = getLogo();
    if (logo) {
      let linkElement = document.querySelector("link[rel~='icon']");
      if (linkElement) linkElement.href = logo;
    }
  }, []);

  useEffect(() => {
    let preferredLang;
    if (userState?.user?.setting) {
      try {
        const settings = JSON.parse(userState.user.setting);
        preferredLang = normalizeLanguage(settings.language);
      } catch (e) {}
    }
    if (!preferredLang) {
      const savedLang = localStorage.getItem('i18nextLng');
      if (savedLang) preferredLang = normalizeLanguage(savedLang);
    }
    if (preferredLang) {
      localStorage.setItem('i18nextLng', preferredLang);
      if (preferredLang !== i18n.language) i18n.changeLanguage(preferredLang);
    }
  }, [i18n, userState?.user?.setting]);

  return (
    <div className='flex h-screen flex-col bg-background text-foreground'>
      {/* Header */}
      <AppHeader
        onMobileMenuToggle={() => setDrawerOpen((prev) => !prev)}
        drawerOpen={drawerOpen}
      />

      <div className='flex flex-1 overflow-hidden'>
        {/* Desktop sidebar */}
        {isConsoleRoute && !isMobile && (
          <aside
            className='shrink-0 transition-all duration-200'
            style={{ width: collapsed ? 60 : 220 }}
          >
            <AppSidebar
              onNavigate={() => {
                if (isMobile) setDrawerOpen(false);
              }}
            />
          </aside>
        )}

        {/* Mobile sidebar sheet */}
        {isConsoleRoute && isMobile && (
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent side='left' className='w-[260px] p-0'>
              <AppSidebar
                onNavigate={() => setDrawerOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Main content */}
        <main className={cn(
          'flex-1 flex flex-col overflow-y-auto',
          isMobile ? '' : 'overflow-x-hidden',
        )}>
          <div className={cn(
            'flex-1',
            shouldInnerPadding && (isMobile ? 'p-2' : 'p-6'),
          )}>
            <App />
          </div>

          {!shouldHideFooter && <FooterBar />}
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster position='top-right' richColors />
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
