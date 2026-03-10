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
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import AppButton from './Button';

const AppDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  loading = false,
  widthClassName = 'max-w-xl',
  children,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm'>
      <div
        className={cn(
          'console-card console-card-elevated w-full overflow-hidden rounded-[24px] bg-[var(--app-surface-strong)]',
          widthClassName,
        )}
      >
        <div className='flex items-start justify-between gap-4 border-b border-[var(--app-border)] px-6 py-5'>
          <div>
            <div className='text-base font-semibold text-[var(--app-text)]'>{title}</div>
            {description ? (
              <div className='mt-1 text-sm leading-6 text-[var(--app-text-muted)]'>
                {description}
              </div>
            ) : null}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='console-icon-button'
            aria-label='Close dialog'
          >
            <X size={16} />
          </button>
        </div>

        <div className='px-6 py-6'>{children}</div>

        <div className='flex flex-col-reverse gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-6 py-4 sm:flex-row sm:justify-end'>
          <AppButton variant='ghost' onClick={onClose}>
            {cancelText}
          </AppButton>
          <AppButton variant='primary' onClick={onConfirm} disabled={loading}>
            {loading ? '...' : confirmText}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default AppDialog;
