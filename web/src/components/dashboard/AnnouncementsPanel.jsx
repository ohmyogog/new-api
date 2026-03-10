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

import React from 'react';
import { Bell } from 'lucide-react';
import { marked } from 'marked';
import ScrollableContainer from '../common/ui/ScrollableContainer';
import AppBadge from '../app-ui/Badge';
import AppCard from '../app-ui/Card';
import AppEmptyState from '../app-ui/EmptyState';

const colorMap = {
  grey: '#98a2b3',
  blue: '#2e90fa',
  green: '#12b76a',
  orange: '#f79009',
  red: '#f04438',
};

const AnnouncementsPanel = ({
  announcementData,
  announcementLegendData,
  t,
}) => {
  return (
    <AppCard
      className='lg:col-span-2'
      title={t('系统公告')}
      subtitle={t('跟踪平台发布、升级、维护与异常信息。')}
      actions={
        <div className='flex flex-wrap gap-2'>
          <AppBadge variant='neutral'>{t('显示最新20条')}</AppBadge>
          {announcementLegendData.map((legend, index) => (
            <span key={index} className='console-badge'>
              <span
                className='h-2 w-2 rounded-full'
                style={{ backgroundColor: colorMap[legend.color] || '#98a2b3' }}
              />
              <span>{legend.label}</span>
            </span>
          ))}
        </div>
      }
      bodyClassName='p-0'
    >
      <ScrollableContainer maxHeight='24rem'>
        {announcementData.length > 0 ? (
          <div className='space-y-3 p-4'>
            {announcementData.map((item, idx) => {
              const htmlExtra = item.extra ? marked.parse(item.extra) : '';
              return (
                <article
                  key={idx}
                  className='rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4'
                >
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='flex items-start gap-3'>
                      <div
                        className='mt-1 h-2.5 w-2.5 rounded-full'
                        style={{ backgroundColor: colorMap[item.type] || '#98a2b3' }}
                      />
                      <div>
                        <div
                          className='prose prose-sm max-w-none text-[var(--app-text)] prose-p:my-1 prose-p:text-[var(--app-text)] prose-strong:text-[var(--app-text)]'
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(item.content || ''),
                          }}
                        />
                        {item.extra ? (
                          <div
                            className='mt-3 text-xs leading-6 text-[var(--app-text-muted)]'
                            dangerouslySetInnerHTML={{ __html: htmlExtra }}
                          />
                        ) : null}
                      </div>
                    </div>
                    <div className='shrink-0 text-xs leading-6 text-[var(--app-text-soft)]'>
                      {item.relative ? `${item.relative} · ` : ''}
                      {item.time}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className='p-4'>
            <AppEmptyState
              icon={<Bell size={18} />}
              title={t('暂无系统公告')}
              description={t('请联系管理员在系统设置中配置公告信息')}
            />
          </div>
        )}
      </ScrollableContainer>
    </AppCard>
  );
};

export default AnnouncementsPanel;
