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

const AppMetricCard = ({
  className,
  title,
  eyebrow,
  icon,
  children,
  actions,
}) => {
  return (
    <section
      className={cn(
        'console-card console-card-elevated flex h-full flex-col gap-4 rounded-[24px] px-5 py-5',
        className,
      )}
    >
      <div className='flex items-start justify-between gap-4'>
        <div>
          {eyebrow ? (
            <div className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]'>
              {eyebrow}
            </div>
          ) : null}
          <div className='mt-2 flex items-center gap-2 text-[var(--app-text)]'>
            {icon ? (
              <span className='flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]'>
                {icon}
              </span>
            ) : null}
            <h3 className='text-sm font-semibold tracking-[-0.01em]'>{title}</h3>
          </div>
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className='flex-1'>{children}</div>
    </section>
  );
};

export default AppMetricCard;
