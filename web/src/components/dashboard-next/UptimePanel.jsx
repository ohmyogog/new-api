import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Gauge, RefreshCw } from 'lucide-react';

const UptimePanel = ({
  uptimeData,
  uptimeLoading,
  activeUptimeTab,
  setActiveUptimeTab,
  loadUptimeData,
  uptimeLegendData,
  renderMonitorList,
  t,
}) => {
  return (
    <div className='glass-panel rounded-2xl overflow-hidden lg:col-span-1'>
      <div className='p-6 pb-3'>
        <div className='flex items-center justify-between'>
          <h3 className='flex items-center gap-2 text-base font-bold'>
            <Gauge className='h-4 w-4 text-primary/40' />
            {t('服务可用性')}
          </h3>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-xl hover:bg-primary/5 hover:text-primary'
            onClick={loadUptimeData}
            disabled={uptimeLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${uptimeLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {uptimeLoading && uptimeData.length === 0 ? (
        <div className='px-6 pb-4 space-y-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center gap-3'>
              <Skeleton className='h-3 w-3 rounded-full' />
              <Skeleton className='h-4 flex-1' />
              <Skeleton className='h-4 w-16' />
            </div>
          ))}
        </div>
      ) : uptimeData.length > 0 ? (
        uptimeData.length === 1 ? (
          <ScrollArea className='h-[21rem]'>
            <div className='px-6 pb-2'>
              {renderMonitorList(uptimeData[0].monitors)}
            </div>
          </ScrollArea>
        ) : (
          <Tabs value={activeUptimeTab} onValueChange={setActiveUptimeTab}>
            <div className='px-6'>
              <TabsList className='w-full bg-primary/5'>
                {uptimeData.map((group, idx) => (
                  <TabsTrigger key={idx} value={group.categoryName} className='flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg'>
                    <Gauge className='h-3 w-3' />
                    {group.categoryName}
                    <Badge variant='secondary' className='ml-1 h-5 px-1.5 text-xs bg-primary/10 text-primary'>
                      {group.monitors ? group.monitors.length : 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {uptimeData.map((group, idx) => (
              <TabsContent key={idx} value={group.categoryName} className='mt-0'>
                <ScrollArea className='h-[18rem]'>
                  <div className='px-6 pb-2'>
                    {renderMonitorList(group.monitors)}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )
      ) : (
        <div className='flex justify-center items-center py-8 text-muted-foreground text-sm'>
          {t('暂无监控数据')}
        </div>
      )}

      {uptimeData.length > 0 && (
        <div className='p-3 border-t border-primary/10 bg-primary/[0.02] rounded-b-2xl'>
          <div className='flex flex-wrap gap-3 text-xs justify-center'>
            {uptimeLegendData.map((legend, index) => (
              <div key={index} className='flex items-center gap-1.5'>
                <div className='w-2 h-2 rounded-full' style={{ backgroundColor: legend.color }} />
                <span className='text-muted-foreground'>{legend.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UptimePanel;
