import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VChart } from '@visactor/react-vchart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const StatsCards = ({
  groupedStatsData,
  loading,
  getTrendSpec,
  CARD_PROPS,
  CHART_CONFIG,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className='mb-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
        {groupedStatsData.map((group, idx) => (
          <div key={idx} className='glass-panel rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all relative'>
            <div className='absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity' />
            <div className='relative z-10 p-5'>
              <div className='mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                {group.title}
              </div>
              <div className='space-y-4'>
                {group.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className='flex items-center justify-between cursor-pointer group/item'
                    onClick={item.onClick}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='h-9 w-9 rounded-xl bg-primary/10 text-primary text-xs flex items-center justify-center font-bold'>
                        {item.icon}
                      </div>
                      <div>
                        <div className='text-xs text-muted-foreground'>
                          {item.title}
                        </div>
                        {loading ? (
                          <Skeleton className='h-6 w-16 mt-0.5' />
                        ) : (
                          <div className='text-xl font-black tracking-tight'>
                            {item.value}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.title === t('当前余额') ? (
                      <Badge
                        variant='secondary'
                        className='cursor-pointer bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg'
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/console/topup');
                        }}
                      >
                        {t('充值')}
                      </Badge>
                    ) : (
                      (loading || (item.trendData && item.trendData.length > 0)) && (
                        <div className='w-24 h-10 opacity-80 group-hover/item:opacity-100 transition-opacity'>
                          <VChart
                            spec={getTrendSpec(item.trendData, item.trendColor)}
                            option={CHART_CONFIG}
                          />
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCards;
