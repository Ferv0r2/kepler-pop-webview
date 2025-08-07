'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Globe, ImageIcon, Save, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { ConfirmationModal } from '@/components/logic/dialogs/ConfirmationModal';
import { GuestUpgradeModal } from '@/components/logic/dialogs/GuestUpgradeModal';
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
import { useRouter } from '@/i18n/routing';
import { updateUserInfo } from '@/networks/KeplerBackend';
import { useAuthStore } from '@/store/authStore';
import { NativeToWebMessageType, WebToNativeMessageType } from '@/types/native-call';

import { LoadingView } from '../LoadingView/LoadingView';

import { LOCALE_NAMES, PLANT_IMAGES } from './constants/settings-config';

const useUpdateUserInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
export const SettingsView = () => {
  const t = useTranslations();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { data: userInfo, isLoading } = useUser();
  const { sendMessage, addMessageHandler } = useWebViewBridgeContext();
  const updateUserInfoMutation = useUpdateUserInfo();
  const router = useRouter();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const queryClient = useQueryClient();

  const [nickname, setNickname] = useState(userInfo?.nickname || '');
  const [selectedLocale, setSelectedLocale] = useState(userInfo?.locale || 'en');
  const [selectedProfileImage, setSelectedProfileImage] = useState(userInfo?.profileImage || PLANT_IMAGES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'language'>('profile');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDifferentAccountModal, setShowDifferentAccountModal] = useState(false);
  const { isGuest } = useAuthStore();

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
      setNickname(userInfo.nickname || '');
      setSelectedLocale(userInfo.locale || 'ko');
      setSelectedProfileImage(userInfo.profileImage || PLANT_IMAGES[0]);
    }
  }, [userInfo, hasLoadedOnce]);

  useEffect(() => {
    if (userInfo) {
      const hasNicknameChanged = nickname !== (userInfo.nickname || '');
      const hasLocaleChanged = selectedLocale !== (userInfo.locale || 'en');
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

  const { nickname: userNickname, gameMoney, gem, profileImage } = userInfo;

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (activeTab === 'profile') {
        await updateUserInfoMutation.mutateAsync({
          nickname: nickname.trim(),
          profileImage: selectedProfileImage,
        });
      } else if (activeTab === 'language') {
        await updateUserInfoMutation.mutateAsync({
          locale: selectedLocale,
        });

        // locale이 변경된 경우 새 언어로 리다이렉트
        if (selectedLocale !== (userInfo?.locale || 'en')) {
          // 쿠키에 새 로케일 설정
          document.cookie = `NEXT_LOCALE=${selectedLocale}; path=/; max-age=31536000`;
          // next-intl의 redirect를 사용하여 새 언어로 리다이렉트
          setTimeout(() => {
            window.location.href = `/${selectedLocale}/settings`;
          }, 100);
          return;
        }
      }

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
    queryClient.clear();

    clearTokens();
    queueMicrotask(() => {
      router.push('/auth');
    });
  };

  const isNicknameValid = nickname.trim().length >= 2 && nickname.trim().length <= 16;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-0 relative">
      <header className="sticky w-full left-0 top-0 z-10">
        <TopNavigation
          name={userNickname}
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
              {isGuest ? (
                /* 게스트 사용자 로그인 옵션 */
                <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <span>🔐</span>
                      {t('auth.loginOptions')}
                    </CardTitle>
                    <CardDescription className="text-slate-300">{t('auth.chooseLoginMethod')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 계정 업그레이드 옵션 */}
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                            <span className="text-white text-lg">🔗</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{t('auth.upgradeAccount')}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {t('auth.upgradeAccountDescription')}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowUpgradeModal(true)}
                          className="w-full h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                                   text-white font-medium shadow-lg transition-all duration-200"
                        >
                          {t('auth.upgradeAccount')}
                        </Button>
                      </div>
                    </div>

                    {/* 다른 계정으로 로그인 옵션 */}
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
                            <span className="text-white text-lg">🔄</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{t('auth.loginWithDifferentAccount')}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {t('auth.differentAccountDescription')}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowDifferentAccountModal(true)}
                          className="w-full h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 
                                   text-white font-medium shadow-lg transition-all duration-200"
                        >
                          {t('auth.loginWithDifferentAccount')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* 일반 사용자 프로필 설정 */
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
              )}
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
          {/* 액션 버튼들 */}
          <div className="space-y-4">
            {/* 저장 버튼 - 게스트가 아니고 프로필 탭이거나 언어 탭일 때 표시 */}
            {!(activeTab === 'profile' && isGuest) && (
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
            )}

            {/* 로그아웃 버튼 - 게스트가 아닐 때만 표시 */}
            {!isGuest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full h-12 text-lg font-semibold"
                >
                  {t('settings.logout')}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <footer className="sticky left-0 bottom-0 z-10">
        <BottomNavigation />
      </footer>

      {/* 게스트 업그레이드 모달 */}
      <GuestUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgradeSuccess={() => {
          setShowUpgradeModal(false);
          // 업그레이드 성공 후 페이지 새로고침
          window.location.reload();
        }}
      />

      {/* 다른 계정 로그인 모달 */}
      <GuestUpgradeModal
        isOpen={showDifferentAccountModal}
        onClose={() => setShowDifferentAccountModal(false)}
        onUpgradeSuccess={() => {
          setShowDifferentAccountModal(false);
          // 로그인 성공 후 페이지 새로고침
          window.location.reload();
        }}
        isDifferentAccountMode={true}
      />

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
