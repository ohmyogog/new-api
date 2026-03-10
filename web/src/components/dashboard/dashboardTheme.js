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

export const dashboardColorScales = [
  '#5867d8',
  '#7b8cff',
  '#8b5cf6',
  '#14b8a6',
  '#2e90fa',
  '#12b76a',
  '#f79009',
  '#f04438',
];

export const dashboardChartOption = {
  mode: 'desktop-browser',
  theme: {
    colorScheme: {
      default: dashboardColorScales,
    },
    padding: 0,
    background: 'transparent',
    title: {
      textStyle: {
        fill: '#101828',
        fontSize: 15,
        fontWeight: '600',
      },
      subtextStyle: {
        fill: '#667085',
        fontSize: 12,
      },
    },
    axis: {
      domainLine: {
        style: {
          stroke: 'rgba(15, 23, 42, 0.08)',
        },
      },
      grid: {
        style: {
          stroke: 'rgba(15, 23, 42, 0.06)',
          lineDash: [4, 4],
        },
      },
      label: {
        style: {
          fill: '#667085',
          fontSize: 11,
        },
      },
      title: {
        style: {
          fill: '#98a2b3',
          fontSize: 11,
        },
      },
    },
    legend: {
      item: {
        label: {
          style: {
            fill: '#667085',
            fontSize: 12,
          },
        },
      },
    },
  },
};
