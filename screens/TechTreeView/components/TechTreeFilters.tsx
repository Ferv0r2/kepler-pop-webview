'use client';

import { motion } from 'framer-motion';

import type { TechTreeCategory } from '@/types/tech-tree-types';

interface TechTreeFiltersProps {
  selectedCategory: TechTreeCategory | 'all';
  onCategoryChange: (category: TechTreeCategory | 'all') => void;
}

const categories: { key: TechTreeCategory | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '전체', color: '#6b7280' },
  { key: 'movement', label: '움직임', color: '#10b981' },
  { key: 'combo', label: '콤보', color: '#f59e0b' },
  { key: 'artifacts', label: '유물', color: '#8b5cf6' },
  { key: 'shuffle', label: '셔플', color: '#06b6d4' },
  { key: 'items', label: '아이템', color: '#ef4444' },
];

export const TechTreeFilters = ({ selectedCategory, onCategoryChange }: TechTreeFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      {categories.map((category, index) => (
        <motion.button
          key={category.key}
          onClick={() => onCategoryChange(category.key)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm
            ${
              selectedCategory === category.key
                ? 'text-white shadow-lg ring-2 ring-white/20'
                : 'text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50'
            }
          `}
          style={{
            background: selectedCategory === category.key ? category.color : undefined,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {category.label}
        </motion.button>
      ))}
    </div>
  );
};
