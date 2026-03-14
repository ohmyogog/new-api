import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Gauge, ExternalLink } from 'lucide-react';

const ApiInfoPanel = ({
  apiInfoData,
  handleCopyUrl,
  handleSpeedTest,
  t,
}) => {
  return (
    <div className='glass-panel rounded-2xl overflow-hidden'>
      <div className='p-6 pb-3'>
        <h3 className='flex items-center gap-2 text-base font-bold'>
          <Server className='h-4 w-4 text-primary/40' />
          {t('API信息')}
        </h3>
      </div>
      <ScrollArea className='h-[24rem]'>
        <div className='px-6 pb-4'>
          {apiInfoData.length > 0 ? (
            apiInfoData.map((api, idx) => (
              <React.Fragment key={api.id}>
                <div className='flex py-3 hover:bg-primary/5 rounded-xl transition-colors cursor-pointer px-3 -mx-3'>
                  <div className='flex-shrink-0 mr-3'>
                    <div className='h-9 w-9 rounded-xl bg-primary/10 text-primary text-xs flex items-center justify-center font-bold'>
                      {api.route.substring(0, 2)}
                    </div>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex flex-wrap items-center justify-between mb-1 gap-2'>
                      <span className='text-sm font-bold break-all'>
                        {api.route}
                      </span>
                      <div className='flex items-center gap-1'>
                        <Badge
                          variant='secondary'
                          className='cursor-pointer bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors text-xs gap-1 rounded-lg'
                          onClick={() => handleSpeedTest(api.url)}
                        >
                          <Gauge className='h-3 w-3' />
                          {t('测速')}
                        </Badge>
                        <Badge
                          variant='secondary'
                          className='cursor-pointer bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors text-xs gap-1 rounded-lg'
                          onClick={() => window.open(api.url, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className='h-3 w-3' />
                          {t('跳转')}
                        </Badge>
                      </div>
                    </div>
                    <div
                      className='text-sm text-primary break-all cursor-pointer hover:underline mb-1'
                      onClick={() => handleCopyUrl(api.url)}
                    >
                      {api.url}
                    </div>
                    <div className='text-xs text-muted-foreground'>{api.description}</div>
                  </div>
                </div>
                {idx < apiInfoData.length - 1 && <Separator className='opacity-50' />}
              </React.Fragment>
            ))
          ) : (
            <div className='flex justify-center items-center min-h-[20rem] text-muted-foreground text-sm'>
              {t('暂无API信息')}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ApiInfoPanel;
