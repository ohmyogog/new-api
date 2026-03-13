import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {groupedStatsData.map((group, idx) => (
          <Card key={idx} className='overflow-hidden'>
            <CardContent className='p-5'>
              <div className='mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                {group.title}
              </div>
              <div className='space-y-4'>
                {group.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className='flex items-center justify-between cursor-pointer group'
                    onClick={item.onClick}
                  >
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8'>
                        <AvatarFallback className='bg-primary/10 text-primary text-xs'>
                          {item.icon}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='text-xs text-muted-foreground'>
                          {item.title}
                        </div>
                        {loading ? (
                          <Skeleton className='h-6 w-16 mt-0.5' />
                        ) : (
                          <div className='text-lg font-bold tracking-tight'>
                            {item.value}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.title === t('当前余额') ? (
                      <Badge
                        variant='secondary'
                        className='cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors'
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/console/topup');
                        }}
                      >
                        {t('充值')}
                      </Badge>
                    ) : (
                      (loading || (item.trendData && item.trendData.length > 0)) && (
                        <div className='w-24 h-10 opacity-80 group-hover:opacity-100 transition-opacity'>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StatsCards;
