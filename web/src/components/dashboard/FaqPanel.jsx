/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { marked } from 'marked';
import ScrollableContainer from '../common/ui/ScrollableContainer';
import AppCard from '../app-ui/Card';
import AppEmptyState from '../app-ui/EmptyState';

const FaqPanel = ({
  faqData,
  t,
}) => {
  const [openIndex, setOpenIndex] = useState(faqData.length > 0 ? 0 : null);

  return (
    <AppCard
      className='lg:col-span-1'
      title={t('常见问答')}
      subtitle={t('帮助团队快速定位常见问题与配置说明。')}
      bodyClassName='p-0'
    >
      <ScrollableContainer maxHeight='24rem'>
        {faqData.length > 0 ? (
          <div className='space-y-3 p-4'>
            {faqData.map((item, index) => {
              const opened = openIndex === index;

              return (
                <section
                  key={index}
                  className='overflow-hidden rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)]'
                >
                  <button
                    type='button'
                    onClick={() => setOpenIndex(opened ? null : index)}
                    className='flex w-full items-center justify-between gap-4 px-4 py-4 text-left'
                  >
                    <span className='text-sm font-semibold text-[var(--app-text)]'>
                      {item.question}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[var(--app-text-muted)] transition-transform ${opened ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {opened ? (
                    <div className='border-t border-[var(--app-border)] px-4 py-4 text-sm leading-7 text-[var(--app-text-muted)]'>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(item.answer || ''),
                        }}
                      />
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <div className='p-4'>
            <AppEmptyState
              icon={<HelpCircle size={18} />}
              title={t('暂无常见问答')}
              description={t('请联系管理员在系统设置中配置常见问答')}
            />
          </div>
        )}
      </ScrollableContainer>
    </AppCard>
  );
};

export default FaqPanel;
