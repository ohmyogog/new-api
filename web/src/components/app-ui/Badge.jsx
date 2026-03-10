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

const variantMap = {
  neutral: 'console-badge',
  primary: 'console-badge console-badge-primary',
  success: 'console-badge console-badge-success',
  warning: 'console-badge console-badge-warning',
  danger: 'console-badge console-badge-danger',
};

const AppBadge = ({ className, variant = 'neutral', children }) => {
  return <span className={cn(variantMap[variant] || variantMap.neutral, className)}>{children}</span>;
};

export default AppBadge;
