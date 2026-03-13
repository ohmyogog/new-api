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

import React, { useState } from 'react';
import MissingModelsModal from './modals/MissingModelsModal';
import PrefillGroupManagement from './modals/PrefillGroupManagement';
import EditPrefillGroupModal from './modals/EditPrefillGroupModal';
import { Modal, Popover } from '@douyinfe/semi-ui';
import { showSuccess, showError, copy } from '../../../helpers';
import CompactModeToggle from '../../common/ui/CompactModeToggle';
import SelectionNotification from './components/SelectionNotification';
import UpstreamConflictModal from './modals/UpstreamConflictModal';
import SyncWizardModal from './modals/SyncWizardModal';
import AppButton from '../../app-ui/Button';

const ModelsActions = ({
  selectedKeys,
  setSelectedKeys,
  setEditingModel,
  setShowEdit,
  batchDeleteModels,
  syncing,
  previewing,
  syncUpstream,
  previewUpstreamDiff,
  applyUpstreamOverwrite,
  compactMode,
  setCompactMode,
  t,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showAddPrefill, setShowAddPrefill] = useState(false);
  const [prefillInit, setPrefillInit] = useState({ id: undefined });
  const [showConflict, setShowConflict] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncLocale, setSyncLocale] = useState('zh');

  const handleSyncUpstream = async (locale) => {
    const data = await previewUpstreamDiff?.({ locale });
    const conflictItems = data?.conflicts || [];
    if (conflictItems.length > 0) {
      setConflicts(conflictItems);
      setShowConflict(true);
      return;
    }
    await syncUpstream?.({ locale });
  };

  const handleDeleteSelectedModels = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    batchDeleteModels();
    setShowDeleteModal(false);
  };

  const handleClearSelected = () => {
    setSelectedKeys([]);
  };

  const handleCopyNames = async () => {
    const text = selectedKeys.map((m) => m.model_name).join(',');
    if (!text) return;
    const ok = await copy(text);
    if (ok) {
      showSuccess(t('已复制模型名称'));
    } else {
      showError(t('复制失败'));
    }
  };

  const handleAddToPrefill = () => {
    const items = selectedKeys.map((m) => m.model_name);
    setPrefillInit({ id: undefined, type: 'model', items });
    setShowAddPrefill(true);
  };

  return (
    <>
      <div className='flex flex-wrap gap-2 w-full md:w-auto order-2 md:order-1'>
        <AppButton
          variant='primary'
          className='flex-1 md:flex-initial'
          onClick={() => {
            setEditingModel({
              id: undefined,
            });
            setShowEdit(true);
          }}
        >
          {t('添加模型')}
        </AppButton>

        <AppButton
          variant='secondary'
          className='flex-1 md:flex-initial'
          onClick={() => setShowMissingModal(true)}
        >
          {t('未配置模型')}
        </AppButton>

        <Popover
          position='bottom'
          trigger='hover'
          content={
            <div className='p-2 max-w-[360px]'>
              <div className='text-[var(--semi-color-text-2)] text-sm'>
                {t(
                  '模型社区需要大家的共同维护，如发现数据有误或想贡献新的模型数据，请访问：',
                )}
              </div>
              <a
                href='https://github.com/basellm/llm-metadata'
                target='_blank'
                rel='noreferrer'
                className='text-blue-600 underline'
              >
                https://github.com/basellm/llm-metadata
              </a>
            </div>
          }
        >
          <AppButton
            variant='secondary'
            className='flex-1 md:flex-initial'
            disabled={syncing || previewing}
            onClick={() => {
              setSyncLocale('zh');
              setShowSyncModal(true);
            }}
          >
            {t('同步')}
          </AppButton>
        </Popover>

        <AppButton
          variant='secondary'
          className='flex-1 md:flex-initial'
          onClick={() => setShowGroupManagement(true)}
        >
          {t('预填组管理')}
        </AppButton>

        <CompactModeToggle
          compactMode={compactMode}
          setCompactMode={setCompactMode}
          t={t}
        />
      </div>

      <SelectionNotification
        selectedKeys={selectedKeys}
        t={t}
        onDelete={handleDeleteSelectedModels}
        onAddPrefill={handleAddToPrefill}
        onClear={handleClearSelected}
        onCopy={handleCopyNames}
      />

      <Modal
        title={t('批量删除模型')}
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onOk={handleConfirmDelete}
        type='warning'
      >
        <div>
          {t('确定要删除所选的 {{count}} 个模型吗？', {
            count: selectedKeys.length,
          })}
        </div>
      </Modal>

      <SyncWizardModal
        visible={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        loading={syncing || previewing}
        t={t}
        onConfirm={async ({ option, locale }) => {
          setSyncLocale(locale);
          if (option === 'official') {
            await handleSyncUpstream(locale);
          }
          setShowSyncModal(false);
        }}
      />

      <MissingModelsModal
        visible={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        onConfigureModel={(name) => {
          setEditingModel({ id: undefined, model_name: name });
          setShowEdit(true);
          setShowMissingModal(false);
        }}
        t={t}
      />

      <PrefillGroupManagement
        visible={showGroupManagement}
        onClose={() => setShowGroupManagement(false)}
      />

      <EditPrefillGroupModal
        visible={showAddPrefill}
        onClose={() => setShowAddPrefill(false)}
        editingGroup={prefillInit}
        onSuccess={() => setShowAddPrefill(false)}
      />

      <UpstreamConflictModal
        visible={showConflict}
        onClose={() => setShowConflict(false)}
        conflicts={conflicts}
        onSubmit={async (payload) => {
          return await applyUpstreamOverwrite?.({
            overwrite: payload,
            locale: syncLocale,
          });
        }}
        t={t}
        loading={syncing}
      />
    </>
  );
};

export default ModelsActions;
