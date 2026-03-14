import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import { marked } from 'marked';

const AnnouncementsPanel = ({
  announcementData,
  announcementLegendData,
  t,
}) => {
  const getTypeColor = (type) => {
    const colorMap = {
      ongoing: 'bg-blue-500',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      error: 'bg-red-500',
      default: 'bg-muted-foreground',
    };
    return colorMap[type] || colorMap.default;
  };

  return (
    <div className='glass-panel rounded-2xl overflow-hidden lg:col-span-2'>
      <div className='p-6 pb-3'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3'>
          <h3 className='flex items-center gap-2 text-base font-bold'>
            <Bell className='h-4 w-4 text-primary/40' />
            {t('系统公告')}
            <Badge variant='outline' className='text-xs font-normal border-primary/20'>
              {t('显示最新20条')}
            </Badge>
          </h3>
          <div className='flex flex-wrap gap-3 text-xs'>
            {announcementLegendData.map((legend, index) => (
              <div key={index} className='flex items-center gap-1.5'>
                <div className={`w-2 h-2 rounded-full ${getTypeColor(legend.type)}`} />
                <span className='text-muted-foreground'>{legend.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ScrollArea className='h-[24rem]'>
        <div className='px-6 pb-4'>
          {announcementData.length > 0 ? (
            <div className='relative ml-3 border-l-2 border-primary/20'>
              {announcementData.map((item, idx) => {
                const htmlExtra = item.extra ? marked.parse(item.extra) : '';
                return (
                  <div key={idx} className='relative pl-6 pb-6 last:pb-0'>
                    <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${getTypeColor(item.type)}`} />
                    <div className='text-xs text-muted-foreground mb-1'>
                      {item.relative ? `${item.relative} ` : ''}{item.time}
                    </div>
                    <div
                      className='text-sm prose prose-sm max-w-none dark:prose-invert'
                      dangerouslySetInnerHTML={{ __html: marked.parse(item.content || '') }}
                    />
                    {item.extra && (
                      <div
                        className='text-xs text-muted-foreground mt-1 prose prose-sm max-w-none dark:prose-invert'
                        dangerouslySetInnerHTML={{ __html: htmlExtra }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='flex justify-center items-center py-8 text-muted-foreground text-sm'>
              {t('暂无系统公告')}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AnnouncementsPanel;
