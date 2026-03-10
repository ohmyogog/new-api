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
import { BellDot, RefreshCw, Search } from 'lucide-react';
import AppButton from '../app-ui/Button';
import AppBadge from '../app-ui/Badge';
import AppSectionHeader from '../app-ui/SectionHeader';

const DashboardHeader = ({
  getGreeting,
  greetingVisible,
  showSearchModal,
  refresh,
  loading,
  t,
}) => {
  return (
    <div className='mb-6 rounded-[28px] border border-[var(--app-border)] bg-[rgba(255,255,255,0.72)] px-6 py-6 shadow-[var(--app-shadow-sm)] backdrop-blur-2xl'>
      <AppSectionHeader
        icon={<BellDot size={18} />}
        title={
          <span
            className='transition-opacity duration-1000 ease-in-out'
            style={{ opacity: greetingVisible ? 1 : 0 }}
          >
            {getGreeting}
          </span>
        }
        subtitle={t('专注监控模型消耗、服务状态与平台运营信号。')}
        actions={
          <>
            <AppBadge variant='primary'>{t('Enterprise Console')}</AppBadge>
            <AppButton variant='ghost' onClick={showSearchModal}>
              <Search size={15} />
              <span>{t('筛选数据')}</span>
            </AppButton>
            <AppButton variant='secondary' onClick={refresh} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? t('刷新中') : t('刷新')}</span>
            </AppButton>
          </>
        }
      />
    </div>
  );
};

export default DashboardHeader;
