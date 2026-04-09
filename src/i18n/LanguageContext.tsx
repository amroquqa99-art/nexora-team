import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { translations, Language } from "./translations";
import { useDynamicContent } from "@/hooks/useDynamicContent";

type TranslationType = (typeof translations)[Language];
type LanguageContextType = {
  lang: Language;
  t: TranslationType;
  toggleLanguage: () => void;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to deep clone and apply dot-notation overrides
const applyOverrides = (base: any, flattenOverrides: Record<string, { ar: string; en: string }>, currentLang: Language) => {
  const result = JSON.parse(JSON.stringify(base)); 

  for (const [keyPath, vals] of Object.entries(flattenOverrides)) {
    const keys = keyPath.split(".");
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k]) current[k] = {};
        current = current[k];
    }
    const lastKey = keys[keys.length - 1];
    
    // Only override if the dynamic value is not empty
    if (vals[currentLang] && vals[currentLang].trim() !== "") {
        current[lastKey] = vals[currentLang];
    }
  }
  return result;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>("ar");
  const { data: dynamicContent } = useDynamicContent();

  const toggleLanguage = () => {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const isRTL = lang === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const t = useMemo(() => {
    if (!dynamicContent) return translations[lang] as TranslationType;
    return applyOverrides(translations[lang], dynamicContent, lang) as TranslationType;
  }, [lang, dynamicContent]);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
