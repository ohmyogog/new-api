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

const AppTabs = ({ tabs, value, onChange, className }) => {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1.5',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type='button'
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex min-h-[36px] items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-all',
              active
                ? 'bg-[var(--app-surface-strong)] text-[var(--app-text)] shadow-[var(--app-shadow-xs)]'
                : 'text-[var(--app-text-muted)] hover:bg-white/70 hover:text-[var(--app-text)]',
            )}
          >
            {tab.icon ? <span className='text-current'>{tab.icon}</span> : null}
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className='rounded-full bg-[var(--app-primary-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--app-primary)]'>
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default AppTabs;
