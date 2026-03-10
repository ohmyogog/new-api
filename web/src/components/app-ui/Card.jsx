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

const AppCard = ({
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  title,
  subtitle,
  actions,
  footer,
  children,
}) => {
  return (
    <section className={cn('console-card console-card-elevated overflow-hidden', className)}>
      {(title || subtitle || actions) && (
        <header
          className={cn(
            'flex flex-col gap-3 border-b border-[var(--app-border)] px-5 py-4 lg:flex-row lg:items-start lg:justify-between',
            headerClassName,
          )}
        >
          <div className='min-w-0'>
            {title ? (
              <div className='text-sm font-semibold tracking-[-0.01em] text-[var(--app-text)]'>
                {title}
              </div>
            ) : null}
            {subtitle ? (
              <div className='mt-1 text-xs leading-6 text-[var(--app-text-muted)]'>
                {subtitle}
              </div>
            ) : null}
          </div>
          {actions ? <div className='flex flex-wrap items-center gap-2'>{actions}</div> : null}
        </header>
      )}

      <div className={cn('px-5 py-5', bodyClassName)}>{children}</div>

      {footer ? (
        <footer
          className={cn(
            'border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-4',
            footerClassName,
          )}
        >
          {footer}
        </footer>
      ) : null}
    </section>
  );
};

export default AppCard;
