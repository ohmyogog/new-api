import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLucideIcon } from '../../helpers/render';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useSidebarCollapsed } from '../../hooks/common/useSidebarCollapsed';
import { useSidebar } from '../../hooks/common/useSidebar';
import { useMinimumLoadingTime } from '../../hooks/common/useMinimumLoadingTime';
import { isAdmin, isRoot, showError } from '../../helpers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

const routerMap = {
  home: '/',
  channel: '/console/channel',
  token: '/console/token',
  redemption: '/console/redemption',
  topup: '/console/topup',
  user: '/console/user',
  subscription: '/console/subscription',
  log: '/console/log',
  midjourney: '/console/midjourney',
  setting: '/console/setting',
  about: '/about',
  detail: '/console',
  pricing: '/pricing',
  task: '/console/task',
  models: '/console/models',
  deployment: '/console/deployment',
  playground: '/console/playground',
  personal: '/console/personal',
};

const NavItem = ({ item, isSelected, collapsed, to, onNavigate }) => {
  const icon = getLucideIcon(item.itemKey, isSelected);

  const content = (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isSelected &&
          'bg-sidebar-accent text-sidebar-primary font-medium',
        !isSelected && 'text-sidebar-foreground/70',
        collapsed && 'justify-center px-2',
      )}
    >
      <span className='flex h-5 w-5 shrink-0 items-center justify-center'>
        {icon}
      </span>
      {!collapsed && <span className='truncate'>{item.text}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side='right' className='font-medium'>
          {item.text}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

const NavGroup = ({ label, items, selectedKeys, collapsed, routerMapState, onNavigate }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className='px-2 py-1'>
      {!collapsed && label && (
        <div className='mb-1 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50'>
          {label}
        </div>
      )}
      <div className='space-y-0.5'>
        {items.map((item) => {
          if (item.className === 'tableHiddle') return null;
          const isSelected = selectedKeys.includes(item.itemKey);
          const to = routerMapState[item.itemKey] || routerMap[item.itemKey];
          if (!to) return null;
          return (
            <NavItem
              key={item.itemKey}
              item={item}
              isSelected={isSelected}
              collapsed={collapsed}
              to={to}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>
    </div>
  );
};

const AppSidebar = ({ onNavigate = () => {} }) => {
  const { t } = useTranslation();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const {
    isModuleVisible,
    hasSectionVisibleModules,
    loading: sidebarLoading,
  } = useSidebar();

  const showSkeleton = useMinimumLoadingTime(sidebarLoading, 200);
  const [selectedKeys, setSelectedKeys] = useState(['home']);
  const [chatItems, setChatItems] = useState([]);
  const location = useLocation();
  const [routerMapState, setRouterMapState] = useState(routerMap);

  // Build menu sections (same logic as original)
  const chatMenuItems = useMemo(() => {
    const items = [
      { text: t('操练场'), itemKey: 'playground', to: '/playground' },
    ];
    return items.filter((item) => isModuleVisible('chat', item.itemKey));
  }, [t, isModuleVisible]);

  const workspaceItems = useMemo(() => {
    const items = [
      {
        text: t('数据看板'), itemKey: 'detail', to: '/detail',
        className: localStorage.getItem('enable_data_export') === 'true' ? '' : 'tableHiddle',
      },
      { text: t('令牌管理'), itemKey: 'token', to: '/token' },
      { text: t('使用日志'), itemKey: 'log', to: '/log' },
      {
        text: t('绘图日志'), itemKey: 'midjourney', to: '/midjourney',
        className: localStorage.getItem('enable_drawing') === 'true' ? '' : 'tableHiddle',
      },
      {
        text: t('任务日志'), itemKey: 'task', to: '/task',
        className: localStorage.getItem('enable_task') === 'true' ? '' : 'tableHiddle',
      },
    ];
    return items.filter((item) => isModuleVisible('console', item.itemKey));
  }, [t, isModuleVisible]);

  const financeItems = useMemo(() => {
    const items = [
      { text: t('钱包管理'), itemKey: 'topup', to: '/topup' },
      { text: t('个人设置'), itemKey: 'personal', to: '/personal' },
    ];
    return items.filter((item) => isModuleVisible('personal', item.itemKey));
  }, [t, isModuleVisible]);

  const adminItems = useMemo(() => {
    const items = [
      { text: t('渠道管理'), itemKey: 'channel', className: isAdmin() ? '' : 'tableHiddle' },
      { text: t('订阅管理'), itemKey: 'subscription', className: isAdmin() ? '' : 'tableHiddle' },
      { text: t('模型管理'), itemKey: 'models', className: isAdmin() ? '' : 'tableHiddle' },
      { text: t('模型部署'), itemKey: 'deployment', className: isAdmin() ? '' : 'tableHiddle' },
      { text: t('兑换码管理'), itemKey: 'redemption', className: isAdmin() ? '' : 'tableHiddle' },
      { text: t('用户管理'), itemKey: 'user', className: isAdmin() ? '' : 'tableHiddle' },
      { text: t('系统设置'), itemKey: 'setting', className: isRoot() ? '' : 'tableHiddle' },
    ];
    return items.filter((item) => isModuleVisible('admin', item.itemKey));
  }, [t, isModuleVisible]);

  // Route matching
  useEffect(() => {
    const currentPath = location.pathname;
    let matchingKey = Object.keys(routerMapState).find(
      (key) => routerMapState[key] === currentPath,
    );
    if (!matchingKey && currentPath.startsWith('/console/chat/')) {
      const chatIndex = currentPath.split('/').pop();
      matchingKey = !isNaN(chatIndex) ? 'chat' + chatIndex : 'chat';
    }
    if (matchingKey) setSelectedKeys([matchingKey]);
  }, [location.pathname, routerMapState]);

  // Body class for collapsed state
  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  }, [collapsed]);

  if (showSkeleton) {
    return (
      <div className={cn(
        'flex h-full flex-col bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}>
        <div className='flex-1 space-y-2 p-3'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={cn('h-8 rounded-lg', collapsed ? 'w-9' : 'w-full')} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn(
        'flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}>
        <ScrollArea className='flex-1'>
          {hasSectionVisibleModules('chat') && (
            <NavGroup
              label={t('聊天')}
              items={chatMenuItems}
              selectedKeys={selectedKeys}
              collapsed={collapsed}
              routerMapState={routerMapState}
              onNavigate={onNavigate}
            />
          )}

          {hasSectionVisibleModules('console') && (
            <>
              <Separator className='mx-3 my-1 w-auto opacity-50' />
              <NavGroup
                label={t('控制台')}
                items={workspaceItems}
                selectedKeys={selectedKeys}
                collapsed={collapsed}
                routerMapState={routerMapState}
                onNavigate={onNavigate}
              />
            </>
          )}

          {hasSectionVisibleModules('personal') && (
            <>
              <Separator className='mx-3 my-1 w-auto opacity-50' />
              <NavGroup
                label={t('个人中心')}
                items={financeItems}
                selectedKeys={selectedKeys}
                collapsed={collapsed}
                routerMapState={routerMapState}
                onNavigate={onNavigate}
              />
            </>
          )}

          {isAdmin() && hasSectionVisibleModules('admin') && (
            <>
              <Separator className='mx-3 my-1 w-auto opacity-50' />
              <NavGroup
                label={t('管理员')}
                items={adminItems}
                selectedKeys={selectedKeys}
                collapsed={collapsed}
                routerMapState={routerMapState}
                onNavigate={onNavigate}
              />
            </>
          )}
        </ScrollArea>

        {/* Collapse toggle */}
        <div className='border-t border-sidebar-border p-2'>
          <Button
            variant='ghost'
            size={collapsed ? 'icon' : 'sm'}
            onClick={toggleCollapsed}
            className={cn(
              'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              !collapsed && 'w-full justify-start gap-2',
            )}
          >
            {collapsed ? (
              <PanelLeft className='h-4 w-4' />
            ) : (
              <>
                <PanelLeftClose className='h-4 w-4' />
                <span className='text-xs'>{t('收起侧边栏')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AppSidebar;
