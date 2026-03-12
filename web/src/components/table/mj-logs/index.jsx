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
import { Layout } from '@douyinfe/semi-ui';
import CardPro from '../../common/ui/CardPro';
import AppSectionHeader from '../../app-ui/SectionHeader';
import { useTranslation } from 'react-i18next';
import { ImageIcon } from 'lucide-react';
import MjLogsTable from './MjLogsTable';
import MjLogsActions from './MjLogsActions';
import MjLogsFilters from './MjLogsFilters';
import ColumnSelectorModal from './modals/ColumnSelectorModal';
import ContentModal from './modals/ContentModal';
import { useMjLogsData } from '../../../hooks/mj-logs/useMjLogsData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';

const MjLogsPage = () => {
  const mjLogsData = useMjLogsData();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <>
      {/* Modals */}
      <ColumnSelectorModal {...mjLogsData} />
      <ContentModal {...mjLogsData} />

      <div className='mb-6 rounded-[28px] border border-[var(--app-border)] bg-[rgba(255,255,255,0.72)] px-6 py-6 shadow-[var(--app-shadow-sm)] backdrop-blur-2xl'>
        <AppSectionHeader
          icon={<ImageIcon size={18} />}
          title={t('绘图日志')}
          subtitle={t('查看 Midjourney 绘图任务的执行记录与结果详情。')}
        />
      </div>

      <Layout>
        <CardPro
          type='type2'
          statsArea={<MjLogsActions {...mjLogsData} />}
          searchArea={<MjLogsFilters {...mjLogsData} />}
          paginationArea={createCardProPagination({
            currentPage: mjLogsData.activePage,
            pageSize: mjLogsData.pageSize,
            total: mjLogsData.logCount,
            onPageChange: mjLogsData.handlePageChange,
            onPageSizeChange: mjLogsData.handlePageSizeChange,
            isMobile: isMobile,
            t: mjLogsData.t,
          })}
          t={mjLogsData.t}
        >
          <MjLogsTable {...mjLogsData} />
        </CardPro>
      </Layout>
    </>
  );
};

export default MjLogsPage;
