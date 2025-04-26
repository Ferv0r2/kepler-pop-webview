'use client';

import { motion } from 'framer-motion';
import { Store, User, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createElement, ElementType, useMemo } from 'react';

export const BottomNavigation = () => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const locale = pathname.split('/')[1] || 'en';

  const navigationButtons = useMemo(
    () => [
      { icon: Store, label: t('common.store'), path: `/${locale}/store` },
      { icon: Sparkles, label: t('common.play'), path: `/${locale}` },
      { icon: User, label: t('common.profile'), path: `/${locale}/profile` },
    ],
    [t, locale],
  );

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <motion.div
      className="relative bg-gray-900/80 backdrop-blur-md border-t border-gray-800 pb-4"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
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
}

export const BottomNavigationButton = ({ icon, label, isSelected, onClick }: BottomNavigationButtonProps) => {
  return (
    <motion.button
      className={isSelected ? 'relative -mt-8' : 'flex flex-col items-center'}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
    >
      {isSelected ? (
        <>
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full opacity-40 blur-sm" />
          <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-full shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="block text-white text-xs font-medium mt-1">{label}</span>
        </>
      ) : (
        <>
          <div className="p-2">{createElement(icon, { className: 'w-5 h-5 text-gray-400' })}</div>
          <span className="text-gray-400 text-xs">{label}</span>
        </>
      )}
    </motion.button>
  );
};
