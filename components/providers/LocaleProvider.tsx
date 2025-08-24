'use client';

import { NextIntlClientProvider } from 'next-intl';
import { createContext, useContext, useEffect, useState } from 'react';

interface LocaleContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isLoading: boolean;
}

interface LocaleProviderProps {
  children: React.ReactNode;
}

interface Messages {
  [key: string]: string | Messages;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

async function loadMessages(locale: string): Promise<Messages> {
  try {
    const localeModule = (await import(`../../messages/${locale}.json`)) as { default: Messages };
    const messages = localeModule.default;
    return messages;
  } catch {
    // Fallback to English if locale file doesn't exist
    const enModule = (await import('../../messages/en.json')) as { default: Messages };
    const messages = enModule.default;
    return messages;
  }
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<string>('en');
  const [messages, setMessages] = useState<Messages>({});
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
    const initializeLocale = async () => {
      setIsLoading(true);

      let detectedLocale: string = 'en';

      // Check cookie first
      if (typeof document !== 'undefined') {
        const localeCookie = document.cookie.split('; ').find((row) => row.startsWith('locale='));

        if (localeCookie) {
          const cookieLocale = localeCookie.split('=')[1];
          if (['ko', 'en', 'ja', 'zh'].includes(cookieLocale)) {
            detectedLocale = cookieLocale;
          }
        } else {
          // Check browser language
          const browserLang = navigator.language;
          const lang = browserLang.split('-')[0];

          if (['ko', 'en', 'ja', 'zh'].includes(lang)) {
            detectedLocale = lang;
            // Save to cookie
            document.cookie = `locale=${detectedLocale}; path=/; max-age=31536000`;
          }
        }
      }

      const loadedMessages = await loadMessages(detectedLocale);
      setLocaleState(detectedLocale);
      setMessages(loadedMessages);
      setIsLoading(false);
    };

    void initializeLocale();
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
