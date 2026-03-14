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
    <div className='flex items-center justify-between mb-8'>
      <div>
        <h1
          className='text-3xl font-black tracking-tight text-gradient transition-opacity duration-1000 ease-in-out'
          style={{ opacity: greetingVisible ? 1 : 0 }}
        >
          {getGreeting}
        </h1>
      </div>
      <div className='flex items-center gap-3'>
        <Button
          variant='outline'
          size='sm'
          onClick={showSearchModal}
          className='gap-1.5 rounded-xl border-primary/10 bg-white/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all'
        >
          <Search className='h-3.5 w-3.5' />
          {t('搜索')}
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={refresh}
          disabled={loading}
          className='gap-1.5 rounded-xl border-primary/10 bg-white/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all'
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('刷新')}
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
