import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search } from 'lucide-react';

const DashboardHeader = ({
  getGreeting,
  greetingVisible,
  showSearchModal,
  refresh,
  loading,
  t,
}) => {
  return (
    <div className='flex items-center justify-between mb-6'>
      <div>
        <h1
          className='text-2xl font-bold tracking-tight text-foreground transition-opacity duration-1000 ease-in-out'
          style={{ opacity: greetingVisible ? 1 : 0 }}
        >
          {getGreeting}
        </h1>
      </div>
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={showSearchModal} className='gap-1.5'>
          <Search className='h-3.5 w-3.5' />
          {t('搜索')}
        </Button>
        <Button variant='outline' size='sm' onClick={refresh} disabled={loading} className='gap-1.5'>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('刷新')}
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
