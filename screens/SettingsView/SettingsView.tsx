'use client';

import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Globe, ImageIcon, Save, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { ConfirmationModal } from '@/components/logic/dialogs/ConfirmationModal';
import { BottomNavigation } from '@/components/logic/navigation/BottomNavigation';
import { TopNavigation } from '@/components/logic/navigation/TopNavigation';
import { useWebViewBridgeContext } from '@/components/providers/WebViewBridgeProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/useUser';
import { SUPPORTED_LOCALES } from '@/i18n/constants';
import { updateUserInfo } from '@/networks/KeplerBackend';
import { useAuthStore } from '@/store/authStore';
import { NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';

import { LoadingView } from '../LoadingView/LoadingView';

import { LOCALE_NAMES, PLANT_IMAGES } from './constants/settings-config';

export const SettingsView = () => {
  const t = useTranslations();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { data: userInfo, isLoading } = useUser();
  const { sendMessage, addMessageHandler } = useWebViewBridgeContext();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const clearTokens = useAuthStore((state) => state.clearTokens);

  const [nickname, setNickname] = useState(userInfo?.name || '');
  const [selectedLocale, setSelectedLocale] = useState(userInfo?.locale || 'en');
  const [selectedProfileImage, setSelectedProfileImage] = useState(userInfo?.profileImage || PLANT_IMAGES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'language'>('profile');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const unsubscribeBackState = addMessageHandler(NativeToWebMessageType.CAN_BACK_STATE, () => {
      sendMessage({ type: WebToNativeMessageType.EXIT_ACTION });
    });

    return () => {
      unsubscribeBackState();
    };
  }, [addMessageHandler, sendMessage]);

  useEffect(() => {
    if (userInfo && !hasLoadedOnce) {
      setHasLoadedOnce(true);
      setNickname(userInfo.name || '');
      setSelectedLocale(userInfo.locale || 'ko');
      setSelectedProfileImage(userInfo.profileImage || PLANT_IMAGES[0]);
    }
  }, [userInfo, hasLoadedOnce]);

  useEffect(() => {
    if (userInfo) {
      const hasNicknameChanged = nickname !== (userInfo.name || '');
      const hasLocaleChanged = selectedLocale !== (userInfo.locale || 'ko');
      const hasImageChanged = selectedProfileImage !== (userInfo.profileImage || PLANT_IMAGES[0]);
      setHasChanges(hasNicknameChanged || hasLocaleChanged || hasImageChanged);
    }
  }, [nickname, selectedLocale, selectedProfileImage, userInfo]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!userInfo || (isLoading && !hasLoadedOnce)) {
    return <LoadingView />;
  }

  const { name, level, gameMoney, gem, profileImage } = userInfo;

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (activeTab === 'profile') {
        await updateUserInfo({
          name: nickname.trim(),
          profileImage: selectedProfileImage,
        });
      } else if (activeTab === 'language') {
        await updateUserInfo({
          locale: selectedLocale,
        });

        // locale이 변경된 경우에만 URL 이동
        if (selectedLocale !== (userInfo?.locale || 'ko')) {
          const pathParts = pathname.split('/');
          if (pathParts[1] && pathParts[1].length === 2) {
            pathParts[1] = selectedLocale;
          } else {
            pathParts.splice(1, 0, selectedLocale);
          }
          const newPath = pathParts.join('/') || `/${selectedLocale}/settings`;
          router.push(newPath);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['user'] });
      setSuccess(true);
      setHasChanges(false);
    } catch (e: unknown) {
      let message = t('settings.saveFailed');
      if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: string }).message === 'string') {
        message = (e as { message: string }).message;
      }
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    queryClient.clear();
    const currentLocale = userInfo?.locale || 'en';
    router.push(`/${currentLocale}/auth`);
  };

  const isNicknameValid = nickname.trim().length >= 2 && nickname.trim().length <= 16;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-0 relative">
      <header className="sticky w-full left-0 top-0 z-10">
        <TopNavigation
          name={name}
          level={level}
          gameMoney={gameMoney}
          gem={gem}
          profileImage={profileImage || '/plants/sprout.png'}
        />
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
        {/* 페이지 제목 */}
        <motion.div
          className="text-center mb-8 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
          </div>
          <p className="text-gray-400 text-sm">{t('settings.description')}</p>
        </motion.div>

        {/* 알림 메시지 */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 max-w-2xl mx-auto w-full"
            >
              <Alert className="border-green-500/50 bg-green-500/10">
                <Check className="h-4 w-4 !text-green-400" />
                <AlertDescription className="text-green-400">{t('settings.saveSuccess')}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 max-w-2xl mx-auto w-full"
            >
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 !text-red-400" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 탭 버튼 */}
        <motion.div
          className="flex bg-gray-800/50 rounded-lg p-1 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button
            className={`flex-1 py-2 px-4 rounded-md text-md font-medium transition-all duration-200 ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-6 h-6" />
              {t('settings.settingsProfile')}
            </div>
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-md font-medium transition-all duration-200 ${
              activeTab === 'language' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('language')}
          >
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-6 h-6" />
              {t('settings.settingsLanguage')}
            </div>
          </button>
        </motion.div>

        {/* 설정 카드들 */}
        <div className="max-w-2xl mx-auto w-full space-y-6">
          {/* 프로필 설정 탭 */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-gray-800/60 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    {t('settings.settingsProfile')}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {t('settings.settingsProfileDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 닉네임 */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname" className="text-gray-300 font-medium">
                      {t('settings.nickname')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="nickname"
                        className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20"
                        value={nickname}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNickname(e.target.value)}
                        maxLength={16}
                        placeholder={t('settings.nicknamePlaceholder')}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Badge variant={isNicknameValid ? 'default' : 'destructive'} className="text-xs bg-blue-400">
                          {nickname.length}/16
                        </Badge>
                      </div>
                    </div>
                    {!isNicknameValid && nickname.length > 0 && (
                      <p className="text-red-400 text-sm">{t('settings.nicknameInvalid')}</p>
                    )}
                  </div>

                  <Separator className="bg-gray-700/50" />

                  {/* 프로필 이미지 */}
                  <div className="space-y-3">
                    <Label className="text-gray-300 font-medium flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {t('settings.profileImage')}
                    </Label>
                    <div className="grid grid-cols-5 gap-3">
                      {PLANT_IMAGES.map((img, index) => (
                        <motion.div
                          key={img}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                            selectedProfileImage === img
                              ? 'border-blue-400 shadow-lg shadow-blue-400/25'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          onClick={() => setSelectedProfileImage(img)}
                        >
                          <Image
                            src={img || '/placeholder.svg'}
                            alt={`${t('settings.profileImage')} ${index + 1}`}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                          {selectedProfileImage === img && (
                            <div className="absolute inset-0 bg-blue-400/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-blue-400" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {/* 언어 설정 탭 */}
          {activeTab === 'language' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-gray-800/60 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    {t('settings.settingsLanguage')}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {t('settings.settingsLanguageDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-gray-300 font-medium">
                      {t('settings.language')}
                    </Label>
                    <Select value={selectedLocale} onValueChange={setSelectedLocale}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20">
                        <SelectValue placeholder="언어를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {SUPPORTED_LOCALES.map((locale) => (
                          <SelectItem
                            key={locale}
                            value={locale}
                            className="text-white hover:bg-gray-700 focus:bg-gray-700"
                          >
                            {LOCALE_NAMES[locale] || locale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {/* 저장 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="sticky bottom-4 z-10"
          >
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges || !isNicknameValid}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg shadow-lg"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('settings.saving')}
                </div>
              ) : hasChanges ? (
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  {t('settings.saveChanges')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {t('settings.saved')}
                </div>
              )}
            </Button>
          </motion.div>
          {/* 로그아웃 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-4"
          >
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(true)}
              className="w-full h-12 text-lg font-semibold"
            >
              {t('settings.logout')}
            </Button>
          </motion.div>
        </div>
      </main>

      <footer className="sticky left-0 bottom-0 z-10">
        <BottomNavigation />
      </footer>

      {/* 로그아웃 확인 모달 */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title={t('settings.logout')}
        message={<div className="text-white/80">{t('settings.logoutDescription')}</div>}
        confirmText={t('modal.confirm')}
        cancelText={t('modal.cancel')}
        variant="destructive"
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};
