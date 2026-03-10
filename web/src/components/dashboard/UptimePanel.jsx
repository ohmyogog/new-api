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

import React, { useMemo } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { Gauge, RefreshCw } from 'lucide-react';
import ScrollableContainer from '../common/ui/ScrollableContainer';
import AppButton from '../app-ui/Button';
import AppCard from '../app-ui/Card';
import AppEmptyState from '../app-ui/EmptyState';
import AppTabs from '../app-ui/Tabs';

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
  const uptimeTabs = useMemo(
    () =>
      uptimeData.map((group) => ({
        value: group.categoryName,
        label: group.categoryName,
        icon: <Gauge size={14} />,
        badge: group.monitors ? group.monitors.length : 0,
      })),
    [uptimeData],
  );

  return (
    <AppCard
      className='lg:col-span-1'
      title={t('服务可用性')}
      subtitle={t('监控服务健康状态、类别可用性与实时刷新。')}
      actions={
        <AppButton variant='ghost' onClick={loadUptimeData}>
          <RefreshCw size={14} className={uptimeLoading ? 'animate-spin' : ''} />
          <span>{t('刷新')}</span>
        </AppButton>
      }
      bodyClassName='p-0'
      footer={
        uptimeData.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {uptimeLegendData.map((legend, index) => (
              <span key={index} className='console-badge'>
                <span
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: legend.color }}
                />
                <span>{legend.label}</span>
              </span>
            ))}
          </div>
        ) : null
      }
    >
      <div className='relative'>
        <Spin spinning={uptimeLoading}>
          {uptimeData.length > 0 ? (
            uptimeData.length === 1 ? (
              <ScrollableContainer maxHeight='24rem' className='p-4'>
                {renderMonitorList(uptimeData[0].monitors)}
              </ScrollableContainer>
            ) : (
              <div className='p-4'>
                <AppTabs
                  tabs={uptimeTabs}
                  value={activeUptimeTab}
                  onChange={setActiveUptimeTab}
                  className='mb-4'
                />
                {uptimeData.map((group, groupIdx) => (
                  activeUptimeTab === group.categoryName ? (
                    <ScrollableContainer maxHeight='21.5rem' key={groupIdx}>
                      {renderMonitorList(group.monitors)}
                    </ScrollableContainer>
                  ) : null
                ))}
              </div>
            )
          ) : (
            <div className='p-4'>
              <AppEmptyState
                icon={<Gauge size={18} />}
                title={t('暂无监控数据')}
                description={t('请联系管理员在系统设置中配置Uptime')}
              />
            </div>
          )}
        </Spin>
      </div>
    </AppCard>
  );
};

export default UptimePanel;
