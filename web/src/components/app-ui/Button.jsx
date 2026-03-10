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

const variantClassMap = {
  primary: 'console-toolbar-button console-toolbar-button-primary',
  secondary: 'console-toolbar-button',
  ghost: 'console-ghost-button',
};

const AppButton = ({
  as: Component = 'button',
  className,
  variant = 'secondary',
  type = 'button',
  children,
  ...props
}) => {
  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={cn(variantClassMap[variant] || variantClassMap.secondary, className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export default AppButton;
