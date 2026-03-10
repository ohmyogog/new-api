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
import { BarChart3, LineChart, PieChart, Radar } from 'lucide-react';
import { VChart } from '@visactor/react-vchart';
import AppCard from '../app-ui/Card';
import AppTabs from '../app-ui/Tabs';

const ChartsPanel = ({
  activeChartTab,
  setActiveChartTab,
  spec_line,
  spec_model_line,
  spec_pie,
  spec_rank_bar,
  CHART_CONFIG,
  hasApiInfoPanel,
  t,
}) => {
  const chartTabs = useMemo(
    () => [
      { value: '1', label: t('消耗分布'), icon: <BarChart3 size={14} /> },
      { value: '2', label: t('消耗趋势'), icon: <LineChart size={14} /> },
      { value: '3', label: t('调用次数分布'), icon: <PieChart size={14} /> },
      { value: '4', label: t('调用次数排行'), icon: <Radar size={14} /> },
    ],
    [t],
  );

  return (
    <AppCard
      className={`!rounded-2xl ${hasApiInfoPanel ? 'lg:col-span-3' : ''}`}
      title={t('模型数据分析')}
      subtitle={t('洞察模型消耗、调用趋势与请求占比。')}
      actions={
        <AppTabs
          tabs={chartTabs}
          value={activeChartTab}
          onChange={setActiveChartTab}
        />
      }
      bodyClassName='p-0'
    >
      <div className='h-96 px-2 pb-2 pt-1'>
        {activeChartTab === '1' && (
          <VChart spec={spec_line} option={CHART_CONFIG} />
        )}
        {activeChartTab === '2' && (
          <VChart spec={spec_model_line} option={CHART_CONFIG} />
        )}
        {activeChartTab === '3' && (
          <VChart spec={spec_pie} option={CHART_CONFIG} />
        )}
        {activeChartTab === '4' && (
          <VChart spec={spec_rank_bar} option={CHART_CONFIG} />
        )}
      </div>
    </AppCard>
  );
};

export default ChartsPanel;
