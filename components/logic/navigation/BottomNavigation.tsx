'use client';

import { motion } from 'framer-motion';
import { Store, Settings, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createElement, ElementType, useMemo } from 'react';

import { usePathname, useRouter } from '@/i18n/routing';

export const BottomNavigation = () => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const navigationButtons = useMemo(
    () => [
      { icon: Store, label: t('common.store'), path: '/store', testId: 'nav-store' },
      { icon: Play, label: t('common.play'), path: '/', testId: 'nav-play' },
      { icon: Settings, label: t('common.settings'), path: '/settings', testId: 'nav-settings' },
    ],
    [t],
  );

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <motion.div
      className="relative bg-gray-900/80 backdrop-blur-md border-t border-gray-800 pb-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-around items-center px-6">
        {navigationButtons.map((button) => (
          <BottomNavigationButton
            key={button.path}
            {...button}
            isSelected={pathname === button.path}
            onClick={() => handleNavigation(button.path)}
          />
        ))}
      </div>
    </motion.div>
  );
};

export interface BottomNavigationButtonProps {
  icon: ElementType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  testId?: string;
}

export const BottomNavigationButton = ({ icon, label, isSelected, onClick, testId }: BottomNavigationButtonProps) => {
  return (
    <div className="flex items-center justify-center w-full">
      <motion.button
        data-testid={testId}
        className={isSelected ? 'relative -mt-8 w-full' : 'flex flex-col items-center w-full'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
      >
        {isSelected ? (
          <>
            <div className="absolute w-24 mx-auto -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full opacity-40 blur-sm" />
            <div className="relative w-fit mx-auto bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-full shadow-lg">
              {createElement(icon, { className: 'w-6 h-6 text-white' })}
            </div>
            <span className="block text-white text-md font-medium mt-1">{label}</span>
          </>
        ) : (
          <>
            <div className="p-2">{createElement(icon, { className: 'w-5 h-5 text-gray-400' })}</div>
            <span className="text-gray-400 text-md">{label}</span>
          </>
        )}
      </motion.button>
    </div>
  );
};
