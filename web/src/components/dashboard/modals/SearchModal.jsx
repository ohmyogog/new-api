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
import AppButton from '../../app-ui/Button';
import AppDialog from '../../app-ui/Dialog';

const SearchModal = ({
  searchModalVisible,
  handleSearchConfirm,
  handleCloseModal,
  isMobile,
  isAdminUser,
  inputs,
  dataExportDefaultTime,
  timeOptions,
  handleInputChange,
  t,
}) => {
  const { start_timestamp, end_timestamp, username } = inputs;

  const renderLabel = (label) => (
    <label className='mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]'>
      {label}
    </label>
  );

  return (
    <AppDialog
      open={searchModalVisible}
      onClose={handleCloseModal}
      onConfirm={handleSearchConfirm}
      title={t('搜索条件')}
      description={t('按时间范围、粒度与用户筛选数据看板。')}
      confirmText={t('应用筛选')}
      cancelText={t('取消')}
      widthClassName={isMobile ? 'max-w-full' : 'max-w-2xl'}
    >
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div>
          {renderLabel(t('起始时间'))}
          <input
            type='datetime-local'
            value={start_timestamp ? start_timestamp.replace(' ', 'T') : ''}
            onChange={(event) =>
              handleInputChange(event.target.value.replace('T', ' '), 'start_timestamp')
            }
            className='h-11 w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-ring)]'
          />
        </div>

        <div>
          {renderLabel(t('结束时间'))}
          <input
            type='datetime-local'
            value={end_timestamp ? end_timestamp.replace(' ', 'T') : ''}
            onChange={(event) =>
              handleInputChange(event.target.value.replace('T', ' '), 'end_timestamp')
            }
            className='h-11 w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-ring)]'
          />
        </div>

        <div>
          {renderLabel(t('时间粒度'))}
          <select
            value={dataExportDefaultTime}
            onChange={(event) =>
              handleInputChange(event.target.value, 'data_export_default_time')
            }
            className='h-11 w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-ring)]'
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isAdminUser ? (
          <div>
            {renderLabel(t('用户名称'))}
            <input
              type='text'
              value={username}
              placeholder={t('可选值')}
              onChange={(event) =>
                handleInputChange(event.target.value, 'username')
              }
              className='h-11 w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-ring)]'
            />
          </div>
        ) : null}
      </div>

      <div className='mt-6 flex flex-wrap gap-2'>
        <AppButton variant='ghost' onClick={handleCloseModal}>
          {t('关闭')}
        </AppButton>
      </div>
    </AppDialog>
  );
};

export default SearchModal;
