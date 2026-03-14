import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart } from 'lucide-react';
import { VChart } from '@visactor/react-vchart';

const ChartsPanel = ({
  activeChartTab,
  setActiveChartTab,
  spec_line,
  spec_model_line,
  spec_pie,
  spec_rank_bar,
  CARD_PROPS,
  CHART_CONFIG,
  FLEX_CENTER_GAP2,
  hasApiInfoPanel,
  t,
}) => {
  return (
    <div className={`glass-panel rounded-2xl overflow-hidden ${hasApiInfoPanel ? 'lg:col-span-3' : ''}`}>
      <div className='p-6 pb-3'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3'>
          <h3 className='flex items-center gap-2 text-base font-bold'>
            <PieChart className='h-4 w-4 text-primary/40' />
            {t('模型数据分析')}
          </h3>
          <Tabs value={activeChartTab} onValueChange={setActiveChartTab}>
            <TabsList className='bg-primary/5'>
              <TabsTrigger value='1' className='data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg'>{t('消耗分布')}</TabsTrigger>
              <TabsTrigger value='2' className='data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg'>{t('消耗趋势')}</TabsTrigger>
              <TabsTrigger value='3' className='data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg'>{t('调用次数分布')}</TabsTrigger>
              <TabsTrigger value='4' className='data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg'>{t('调用次数排行')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className='px-6 pb-6'>
        <div className='h-[300px]'>
          {activeChartTab === '1' && spec_pie && (
            <VChart spec={spec_pie} option={CHART_CONFIG} />
          )}
          {activeChartTab === '2' && spec_line && (
            <VChart spec={spec_line} option={CHART_CONFIG} />
          )}
          {activeChartTab === '3' && spec_model_line && (
            <VChart spec={spec_model_line} option={CHART_CONFIG} />
          )}
          {activeChartTab === '4' && spec_rank_bar && (
            <VChart spec={spec_rank_bar} option={CHART_CONFIG} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartsPanel;
