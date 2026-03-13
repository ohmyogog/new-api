import React from 'react';
import { useHeaderBar } from '../../hooks/common/useHeaderBar';
import { useNotifications } from '../../hooks/common/useNotifications';
import { useNavigation } from '../../hooks/common/useNavigation';
import NoticeModal from '../layout/NoticeModal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  Globe,
  User,
  LogOut,
  Settings,
  Wallet,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AppHeader = ({ onMobileMenuToggle, drawerOpen }) => {
  const {
    userState,
    statusState,
    isMobile,
    collapsed,
    logoLoaded,
    currentLang,
    isLoading,
    systemName,
    logo,
    isNewYear,
    isSelfUseMode,
    docsLink,
    isDemoSiteMode,
    isConsoleRoute,
    theme,
    headerNavModules,
    pricingRequireAuth,
    logout,
    handleLanguageChange,
    handleThemeToggle,
    handleMobileMenuToggle,
    navigate,
    t,
  } = useHeaderBar({ onMobileMenuToggle, drawerOpen });

  const {
    noticeVisible,
    unreadCount,
    handleNoticeOpen,
    handleNoticeClose,
    getUnreadKeys,
  } = useNotifications(statusState);

  const { mainNavLinks } = useNavigation(t, docsLink, headerNavModules);

  const isLoggedIn = !!userState?.user;

  return (
    <TooltipProvider>
      <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60'>
        <NoticeModal
          visible={noticeVisible}
          onClose={handleNoticeClose}
          isMobile={isMobile}
          defaultTab={unreadCount > 0 ? 'system' : 'inApp'}
          unreadKeys={getUnreadKeys()}
        />

        <div className='flex h-14 items-center gap-4 px-4'>
          {/* Left: Mobile menu + Logo */}
          <div className='flex items-center gap-2'>
            {isConsoleRoute && isMobile && (
              <Button variant='ghost' size='icon' onClick={handleMobileMenuToggle} className='h-8 w-8'>
                {drawerOpen ? <X className='h-4 w-4' /> : <Menu className='h-4 w-4' />}
              </Button>
            )}

            <Link to='/' className='flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity'>
              {logo && (
                <img src={logo} alt={systemName} className='h-7 w-7 rounded-md object-contain' />
              )}
              {!isMobile && (
                <span className='text-sm font-bold tracking-tight'>{systemName}</span>
              )}
            </Link>
          </div>

          {/* Center: Navigation */}
          {!isMobile && !isLoading && (
            <nav className='flex items-center gap-1 ml-6'>
              {mainNavLinks.map((link) => {
                if (link.requireAuth && !isLoggedIn) return null;
                return (
                  <Link
                    key={link.key || link.to}
                    to={link.to}
                    className='px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent'
                  >
                    {link.text}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right: Actions */}
          <div className='ml-auto flex items-center gap-1'>
            {/* Notifications */}
            {isLoggedIn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant='ghost' size='icon' className='relative h-8 w-8' onClick={handleNoticeOpen}>
                    <Bell className='h-4 w-4' />
                    {unreadCount > 0 && (
                      <span className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('通知')}</TooltipContent>
              </Tooltip>
            )}

            {/* Theme toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleThemeToggle}>
                  {theme === 'dark' ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{theme === 'dark' ? t('浅色模式') : t('深色模式')}</TooltipContent>
            </Tooltip>

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8'>
                  <Globe className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>{t('语言')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { code: 'zh', label: '中文' },
                  { code: 'en', label: 'English' },
                  { code: 'ja', label: '日本語' },
                  { code: 'fr', label: 'Français' },
                  { code: 'ru', label: 'Русский' },
                  { code: 'vi', label: 'Tiếng Việt' },
                ].map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(currentLang === lang.code && 'bg-accent font-medium')}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='gap-2 h-8 px-2'>
                    <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium'>
                      {(userState.user.display_name || userState.user.username || '?')[0].toUpperCase()}
                    </div>
                    {!isMobile && (
                      <span className='text-sm font-medium max-w-[100px] truncate'>
                        {userState.user.display_name || userState.user.username}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium'>{userState.user.display_name || userState.user.username}</p>
                      <p className='text-xs text-muted-foreground'>{userState.user.email || ''}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/console')}>
                    <Settings className='mr-2 h-4 w-4' />
                    {t('控制台')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/console/personal')}>
                    <User className='mr-2 h-4 w-4' />
                    {t('个人设置')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/console/topup')}>
                    <Wallet className='mr-2 h-4 w-4' />
                    {t('钱包管理')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className='text-destructive focus:text-destructive'>
                    <LogOut className='mr-2 h-4 w-4' />
                    {t('退出登录')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !isSelfUseMode && (
                <div className='flex items-center gap-1'>
                  <Button variant='ghost' size='sm' className='h-8' onClick={() => navigate('/login')}>
                    <LogIn className='mr-1.5 h-3.5 w-3.5' />
                    {t('登录')}
                  </Button>
                  <Button size='sm' className='h-8' onClick={() => navigate('/register')}>
                    <UserPlus className='mr-1.5 h-3.5 w-3.5' />
                    {t('注册')}
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default AppHeader;
