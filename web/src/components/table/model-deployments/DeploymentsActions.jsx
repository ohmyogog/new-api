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
import { Popconfirm } from '@douyinfe/semi-ui';
import CompactModeToggle from '../../common/ui/CompactModeToggle';
import AppButton from '../../app-ui/Button';

const DeploymentsActions = ({
  selectedKeys,
  setSelectedKeys,
  setEditingDeployment,
  setShowEdit,
  batchDeleteDeployments,
  batchOperationsEnabled = true,
  compactMode,
  setCompactMode,
  showCreateModal,
  setShowCreateModal,
  t,
}) => {
  const hasSelected = batchOperationsEnabled && selectedKeys.length > 0;

  const handleAddDeployment = () => {
    if (setShowCreateModal) {
      setShowCreateModal(true);
    } else {
      setEditingDeployment({ id: undefined });
      setShowEdit(true);
    }
  };

  const handleBatchDelete = () => {
    batchDeleteDeployments();
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  return (
    <div className='flex flex-wrap gap-2 w-full md:w-auto order-2 md:order-1'>
      <AppButton
        variant='primary'
        className='flex-1 md:flex-initial'
        onClick={handleAddDeployment}
      >
        {t('新建容器')}
      </AppButton>

      {hasSelected && (
        <>
          <Popconfirm
            title={t('确认删除')}
            content={`${t('确定要删除���中的')} ${selectedKeys.length} ${t('个部署吗？此操作不可逆。')}`}
            okText={t('删除')}
            cancelText={t('取消')}
            okType='danger'
            onConfirm={handleBatchDelete}
          >
            <AppButton
              variant='ghost'
              className='flex-1 md:flex-initial border-[rgba(240,68,56,0.22)] bg-[rgba(240,68,56,0.08)] text-[var(--app-danger)] hover:border-[rgba(240,68,56,0.3)] hover:bg-[rgba(240,68,56,0.12)]'
              disabled={selectedKeys.length === 0}
            >
              {t('批量删除')} ({selectedKeys.length})
            </AppButton>
          </Popconfirm>

          <AppButton
            variant='ghost'
            className='flex-1 md:flex-initial'
            onClick={handleDeselectAll}
          >
            {t('取消选���')}
          </AppButton>
        </>
      )}

      <CompactModeToggle
        compactMode={compactMode}
        setCompactMode={setCompactMode}
        t={t}
      />
    </div>
  );
};

export default DeploymentsActions;
