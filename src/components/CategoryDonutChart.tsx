import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

interface DonutItem {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface CategoryDonutChartProps {
  items: DonutItem[];
  total: number;
  onSelectCategory?: (id: string | null) => void;
  selectedCategoryId?: string | null;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  items,
  total,
  onSelectCategory,
  selectedCategoryId,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = hoveredId || selectedCategoryId;
  const activeItem = items.find(i => i.id === activeId);

  // SVG parameters
  const size = 260;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Filter out zero-value items
  const validItems = items.filter(i => i.value > 0);

  if (validItems.length === 0 || total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        <p className="text-sm">Nenhum gasto registrado neste período.</p>
        <span className="text-xs mt-1">Adicione itens para visualizar o gráfico.</span>
      </div>
    );
  }

  // Calculate segment offsets
  let accumulatedAngle = 0;
  const segments = validItems.map(item => {
    const fraction = item.value / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += fraction;

    return {
      ...item,
      fraction,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
          />

          {/* Arcs */}
          {segments.map(seg => {
            const isHovered = activeId === seg.id;
            return (
              <circle
                key={seg.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectCategory && onSelectCategory(seg.id === selectedCategoryId ? null : seg.id)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
          {activeItem ? (
            <>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
                {activeItem.name}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatCurrency(activeItem.value)}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {Math.round((activeItem.value / total) * 100)}% do mês
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Gasto
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatCurrency(total)}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {validItems.length} categorias
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div className="w-full space-y-1.5 max-h-60 overflow-y-auto pr-1 text-xs">
        {validItems
          .sort((a, b) => b.value - a.value)
          .map(item => {
            const pct = Math.round((item.value / total) * 100);
            const isSelected = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? null : item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`w-full flex items-center justify-between p-1.5 rounded-md text-left transition-colors ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    {pct}%
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
};
