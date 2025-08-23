'use client';

import { NextIntlClientProvider } from 'next-intl';
import { createContext, useContext, useEffect, useState } from 'react';

interface LocaleContextType {
  locale: string;
  setLocale: (locale: string) => void;
  isLoading: boolean;
}

interface LocaleProviderProps {
  children: React.ReactNode;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

async function loadMessages(locale: string) {
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return messages;
  } catch {
    // Fallback to English if locale file doesn't exist
    const messages = (await import('../../messages/en.json')).default;
    return messages;
  }
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<string>('en');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const setLocale = async (newLocale: string) => {
    setIsLoading(true);
    try {
      const newMessages = await loadMessages(newLocale);
      setLocaleState(newLocale);
      setMessages(newMessages);

      // Save to cookie
      if (typeof document !== 'undefined') {
        document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
      }
    } catch (error) {
      console.error('Failed to load locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function initializeLocale() {
      setIsLoading(true);

      let detectedLocale: string = 'en';

      // Check cookie first
      if (typeof document !== 'undefined') {
        const localeCookie = document.cookie.split('; ').find((row) => row.startsWith('locale='));

        if (localeCookie) {
          const cookieLocale = localeCookie.split('=')[1];
          if (['ko', 'en', 'ja', 'zh'].includes(cookieLocale)) {
            detectedLocale = cookieLocale as string;
          }
        } else {
          // Check browser language
          const browserLang = navigator.language;
          const lang = browserLang.split('-')[0];

          if (['ko', 'en', 'ja', 'zh'].includes(lang)) {
            detectedLocale = lang as string;
            // Save to cookie
            document.cookie = `locale=${detectedLocale}; path=/; max-age=31536000`;
          }
        }
      }

      const loadedMessages = await loadMessages(detectedLocale);
      setLocaleState(detectedLocale);
      setMessages(loadedMessages);
      setIsLoading(false);
    }

    initializeLocale();
  }, []);

  if (isLoading) {
    // Simple loading fallback
    return <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900"></div>;
  }

  const contextValue: LocaleContextType = {
    locale,
    setLocale,
    isLoading,
  };

  return (
    <LocaleContext.Provider value={contextValue}>
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
