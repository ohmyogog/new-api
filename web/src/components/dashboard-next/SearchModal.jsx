import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={searchModalVisible} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className={`glass-panel ${isMobile ? 'w-full max-w-full h-full rounded-none' : 'sm:max-w-md rounded-2xl'}`}>
        <DialogHeader>
          <DialogTitle className='text-gradient font-bold'>{t('搜索条件')}</DialogTitle>
          <DialogDescription className='sr-only'>{t('设置数据查询的搜索条件')}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>{t('起始时间')}</Label>
            <Input
              type='datetime-local'
              value={formatDateForInput(start_timestamp)}
              onChange={(e) => handleInputChange(e.target.value ? new Date(e.target.value) : null, 'start_timestamp')}
              className='rounded-xl border-primary/10 focus:ring-primary/10 focus:border-primary'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>{t('结束时间')}</Label>
            <Input
              type='datetime-local'
              value={formatDateForInput(end_timestamp)}
              onChange={(e) => handleInputChange(e.target.value ? new Date(e.target.value) : null, 'end_timestamp')}
              className='rounded-xl border-primary/10 focus:ring-primary/10 focus:border-primary'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>{t('时间粒度')}</Label>
            <select
              className='flex h-9 w-full rounded-xl border border-primary/10 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary'
              value={dataExportDefaultTime}
              onChange={(e) => handleInputChange(e.target.value, 'data_export_default_time')}
            >
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {isAdminUser && (
            <div className='space-y-2'>
              <Label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>{t('用户名称')}</Label>
              <Input
                value={username || ''}
                placeholder={t('可选值')}
                onChange={(e) => handleInputChange(e.target.value, 'username')}
                className='rounded-xl border-primary/10 focus:ring-primary/10 focus:border-primary'
              />
            </div>
          )}
        </div>
        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleCloseModal} className='rounded-xl border-primary/10 hover:bg-primary/5'>{t('取消')}</Button>
          <Button onClick={handleSearchConfirm} className='rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'>{t('确认')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
