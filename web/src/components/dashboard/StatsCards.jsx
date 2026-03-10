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
import { Skeleton } from '@douyinfe/semi-ui';
import { VChart } from '@visactor/react-vchart';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppButton from '../app-ui/Button';
import AppMetricCard from '../app-ui/MetricCard';

const StatsCards = ({
  groupedStatsData,
  loading,
  getTrendSpec,
  CHART_CONFIG,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className='mb-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {groupedStatsData.map((group, idx) => (
          <AppMetricCard
            key={group.key || idx}
            className='w-full'
            eyebrow={group.eyebrow}
            title={group.title}
            icon={group.title?.props?.children?.[0] || null}
          >
            <div className='space-y-5'>
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className='flex items-center justify-between gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5'
                  onClick={item.onClick}
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${group.accent}`}
                    >
                      {item.icon}
                    </div>
                    <div className='min-w-0'>
                      <div className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]'>
                        {item.title}
                      </div>
                      <div className='mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--app-text)]'>
                        <Skeleton
                          loading={loading}
                          active
                          placeholder={
                            <Skeleton.Paragraph
                              active
                              rows={1}
                              style={{
                                width: '65px',
                                height: '24px',
                                marginTop: '4px',
                              }}
                            />
                          }
                        >
                          {item.value}
                        </Skeleton>
                      </div>
                    </div>
                  </div>
                  {item.title === t('当前余额') ? (
                    <AppButton
                      variant='ghost'
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/console/topup');
                      }}
                    >
                      {t('充值')}
                    </AppButton>
                  ) : (
                    (loading ||
                      (item.trendData && item.trendData.length > 0)) && (
                      <div className='h-12 w-28'>
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
          </AppMetricCard>
        ))}
      </div>
    </div>
  );
};

export default StatsCards;
