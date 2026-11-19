'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedLanguage } from '../types';

import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';

type LocaleDictionary = Record<string, any>;

const DICTIONARIES: Record<SupportedLanguage, LocaleDictionary> = {
  en,
  hi,
  bn,
  ta,
};

interface I18nContextType {
  locale: SupportedLanguage;
  setLocale: (locale: SupportedLanguage) => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLanguage>('en');

  // Sync initial locale from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('seva_ai_lang_code') as SupportedLanguage;
      if (saved && DICTIONARIES[saved]) {
        setLocaleState(saved);
      }
    } catch (e) {
      console.warn('Could not read lang code from localStorage', e);
    }
  }, []);

  const setLocale = useCallback((newLocale: SupportedLanguage) => {
    if (DICTIONARIES[newLocale]) {
      setLocaleState(newLocale);
      try {
        localStorage.setItem('seva_ai_lang_code', newLocale);
      } catch (e) {}
    }
  }, []);

  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>): string => {
      const parts = keyPath.split('.');
      const currentDict = DICTIONARIES[locale] || en;

      let value: any = currentDict;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }

      // Fallback to English dictionary if translation key not found in active language
      if (value === undefined || value === null) {
        let fallbackVal: any = en;
        for (const part of parts) {
          if (fallbackVal && typeof fallbackVal === 'object' && part in fallbackVal) {
            fallbackVal = fallbackVal[part];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        value = fallbackVal;
      }

      if (typeof value !== 'string') {
        return keyPath; // return key as fallback string
      }

      // Interpolate parameters like {current}, {total}, {name}
      if (params) {
        return Object.entries(params).reduce((str, [k, v]) => {
          return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }, value);
      }

      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
