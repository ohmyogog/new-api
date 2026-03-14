import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { marked } from 'marked';

const FaqPanel = ({ faqData, t }) => {
  const [openItem, setOpenItem] = useState(null);

  return (
    <div className='glass-panel rounded-2xl overflow-hidden lg:col-span-1'>
      <div className='p-6 pb-3'>
        <h3 className='flex items-center gap-2 text-base font-bold'>
          <HelpCircle className='h-4 w-4 text-primary/40' />
          {t('常见问答')}
        </h3>
      </div>
      <ScrollArea className='h-[24rem]'>
        <div className='px-6 pb-4'>
          {faqData.length > 0 ? (
            <div className='space-y-1'>
              {faqData.map((item, index) => (
                <Collapsible
                  key={index}
                  open={openItem === index}
                  onOpenChange={(open) => setOpenItem(open ? index : null)}
                >
                  <CollapsibleTrigger className='flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-primary/5 transition-colors text-left'>
                    <span className='flex-1 pr-2'>{item.question}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-primary/40 transition-transform duration-200 ${openItem === index ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div
                      className='px-3 pb-3 text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert'
                      dangerouslySetInnerHTML={{ __html: marked.parse(item.answer || '') }}
                    />
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className='flex justify-center items-center py-8 text-muted-foreground text-sm'>
              {t('暂无常见问答')}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FaqPanel;
