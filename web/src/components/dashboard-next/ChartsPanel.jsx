import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
    <Card className={hasApiInfoPanel ? 'lg:col-span-3' : ''}>
      <CardHeader className='pb-3'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <PieChart className='h-4 w-4 text-muted-foreground' />
            {t('模型数据分析')}
          </CardTitle>
          <Tabs value={activeChartTab} onValueChange={setActiveChartTab}>
            <TabsList>
              <TabsTrigger value='1'>{t('消耗分布')}</TabsTrigger>
              <TabsTrigger value='2'>{t('消耗趋势')}</TabsTrigger>
              <TabsTrigger value='3'>{t('调用次数分布')}</TabsTrigger>
              <TabsTrigger value='4'>{t('调用次数排行')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default ChartsPanel;
