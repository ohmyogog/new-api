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
import { cn } from '../../lib/cn';

const AppEmptyState = ({ icon, title, description, className }) => {
  return (
    <div
      className={cn(
        'flex min-h-[16rem] flex-col items-center justify-center rounded-[18px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]'>
          {icon}
        </div>
      ) : null}
      <div className='text-sm font-semibold text-[var(--app-text)]'>{title}</div>
      {description ? (
        <div className='mt-2 max-w-sm text-sm leading-6 text-[var(--app-text-muted)]'>
          {description}
        </div>
      ) : null}
    </div>
  );
};

export default AppEmptyState;
