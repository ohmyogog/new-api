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
import { ExternalLink, Gauge, Link2, Server } from 'lucide-react';
import ScrollableContainer from '../common/ui/ScrollableContainer';
import AppBadge from '../app-ui/Badge';
import AppButton from '../app-ui/Button';
import AppCard from '../app-ui/Card';
import AppEmptyState from '../app-ui/EmptyState';

const ApiInfoPanel = ({
  apiInfoData,
  handleCopyUrl,
  handleSpeedTest,
  t,
}) => {
  return (
    <AppCard
      className='console-panel-muted'
      title={t('API信息')}
      subtitle={t('查看公开接口说明、服务地址与测速入口。')}
      actions={<AppBadge variant='neutral'>{apiInfoData.length}</AppBadge>}
      bodyClassName='p-0'
    >
      <ScrollableContainer maxHeight='24rem'>
        {apiInfoData.length > 0 ? (
          apiInfoData.map((api) => (
            <React.Fragment key={api.id}>
              <div className='flex gap-4 px-4 py-4 transition-colors hover:bg-white/80'>
                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]'>
                  <span className='text-xs font-semibold uppercase tracking-[0.08em]'>
                    {api.route.substring(0, 2)}
                  </span>
                </div>
                <div className='flex-1'>
                  <div className='mb-1 flex flex-wrap items-center justify-between gap-2'>
                    <span className='break-all text-sm font-semibold tracking-[-0.01em] text-[var(--app-text)]'>
                      {api.route}
                    </span>
                    <div className='mt-1 flex flex-wrap items-center gap-2 lg:mt-0'>
                      <AppButton
                        variant='ghost'
                        onClick={() => handleSpeedTest(api.url)}
                      >
                        <Gauge size={13} />
                        {t('测速')}
                      </AppButton>
                      <AppButton
                        variant='ghost'
                        onClick={() =>
                          window.open(api.url, '_blank', 'noopener,noreferrer')
                        }
                      >
                        <ExternalLink size={13} />
                        {t('跳转')}
                      </AppButton>
                    </div>
                  </div>
                  <div
                    className='mb-2 flex items-center gap-2 break-all text-sm text-[var(--app-primary)] hover:underline'
                    onClick={() => handleCopyUrl(api.url)}
                  >
                    <Link2 size={14} />
                    {api.url}
                  </div>
                  <div className='text-sm leading-6 text-[var(--app-text-muted)]'>
                    {api.description}
                  </div>
                </div>
              </div>
              <div className='mx-4 border-b border-[var(--app-border)] last:hidden' />
            </React.Fragment>
          ))
        ) : (
          <div className='p-4'>
            <AppEmptyState
              icon={<Server size={18} />}
              title={t('暂无API信息')}
              description={t('请联系管理员在系统设置中配置API信息')}
            />
          </div>
        )}
      </ScrollableContainer>
    </AppCard>
  );
};

export default ApiInfoPanel;
