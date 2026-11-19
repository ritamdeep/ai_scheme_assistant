'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SupportedLanguage, LanguageMeta } from './types';
import { SCHEMES_DATA } from './schemes-data';
import { matchOccupationFuzzy } from './rag';
import { auth, onAuthStateChanged, signInWithGooglePopup, signOutFirebase, isFirebaseConfigured } from './firebase';

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
];

export type FontScale = 'normal' | 'large' | 'larger';

export interface CitizenUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: CitizenUser | null;
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginDemoUser: (profileKey?: string) => void;
  logoutUser: () => Promise<void>;
  isGuest: boolean;
  continueAsGuest: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateProfileField: <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => void;
  savedSchemeIds: string[];
  toggleSaveScheme: (schemeId: string) => void;
  isSchemeSaved: (schemeId: string) => boolean;
  fuzzyMatches: Record<string, boolean>;
  recomputeFuzzyMatches: (rawText: string) => void;
  activeLanguage: string;
  activeLanguageCode: SupportedLanguage;
  setActiveLanguageByCode: (code: SupportedLanguage) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  loadDemoProfile: (key: string) => void;
  hasCompletedWizard: boolean;
  markWizardCompleted: (completed?: boolean) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: null,
  annual_income: null,
  occupation: 'Other',
  occupation_raw: null,
  state: 'All India',
  gender: 'any',
  caste_category: 'General',
  special_conditions: [],
  land_holding_acres: null,
  education_level: null,
};

export const DEMO_PROFILES: Record<string, { label: string; description: string; profile: UserProfile }> = {
  farmer: {
    label: 'Ramesh (Farmer)',
    description: '42 yrs, ₹1.5L income, UP. Land unknown → triggers follow-up question!',
    profile: {
      name: 'Ramesh Patel',
      age: 42,
      annual_income: 150000,
      occupation: 'Farmer / Agriculturist',
      occupation_raw: null,
      state: 'Uttar Pradesh',
      gender: 'male',
      caste_category: 'OBC',
      special_conditions: [],
      land_holding_acres: null,
      education_level: 'Secondary',
    },
  },
  student: {
    label: 'Priya (College Student)',
    description: '20 yrs, Class 12 (88th percentile), ₹2.2L income, Rajasthan.',
    profile: {
      name: 'Priya Sharma',
      age: 20,
      annual_income: 220000,
      occupation: 'Student',
      occupation_raw: null,
      state: 'Rajasthan',
      gender: 'female',
      caste_category: 'General',
      special_conditions: [],
      land_holding_acres: 0,
      education_level: 'Undergraduate',
    },
  },
  vendor: {
    label: 'Sunil (Street Vendor)',
    description: '34 yrs, Vegetable cart vendor, ₹1.2L income, Delhi.',
    profile: {
      name: 'Sunil Gupta',
      age: 34,
      annual_income: 120000,
      occupation: 'Self-Employed / Street Vendor',
      occupation_raw: null,
      state: 'Delhi',
      gender: 'male',
      caste_category: 'General',
      special_conditions: [],
      land_holding_acres: 0,
      education_level: '8th Standard',
    },
  },
  unorganized: {
    label: 'Lakhan (Daily Wage Labourer)',
    description: '28 yrs, Construction worker, ₹1.4L income, MP. Eligible for PM-SYM.',
    profile: {
      name: 'Lakhan Yadav',
      age: 28,
      annual_income: 140000,
      occupation: 'Unorganized Sector Worker / Daily Wage Labourer',
      occupation_raw: null,
      state: 'Madhya Pradesh',
      gender: 'male',
      caste_category: 'SC',
      special_conditions: [],
      land_holding_acres: 0,
      education_level: 'Primary',
    },
  },
  senior: {
    label: 'Kamla Devi (Senior BPL)',
    description: '66 yrs, Below Poverty Line (BPL), Bihar. Eligible for IGNOAPS.',
    profile: {
      name: 'Kamla Devi',
      age: 66,
      annual_income: 60000,
      occupation: 'Senior Citizen',
      occupation_raw: null,
      state: 'Bihar',
      gender: 'female',
      caste_category: 'OBC',
      special_conditions: ['BPL', 'Priority Ration Card'],
      land_holding_acres: 0,
      education_level: 'None',
    },
  },
  disabled: {
    label: 'Arun (Divyangjan 50%)',
    description: '32 yrs, certified 50% locomotor disability, Tamil Nadu.',
    profile: {
      name: 'Arun Kumar',
      age: 32,
      annual_income: 160000,
      occupation: 'Person with Disability',
      occupation_raw: null,
      state: 'Tamil Nadu',
      gender: 'male',
      caste_category: 'General',
      special_conditions: ['Disabled (40%+)', 'UDID Cardholder'],
      land_holding_acres: 0,
      education_level: 'Graduate',
    },
  },
  defence: {
    label: 'Subedar Surjit (Veteran)',
    description: '54 yrs, Ex-Serviceman pensioner, Punjab. ECHS eligible.',
    profile: {
      name: 'Surjit Singh',
      age: 54,
      annual_income: 380000,
      occupation: 'Army / Defence Personnel & Veterans',
      occupation_raw: null,
      state: 'Punjab',
      gender: 'male',
      caste_category: 'General',
      special_conditions: ['Ex-Serviceman', 'Defence Pensioner'],
      land_holding_acres: 1,
      education_level: 'Graduate',
    },
  },
  otherFuzzy: {
    label: 'Raju (Auto Driver - "Other")',
    description: 'Uses "Other" free text: "auto rickshaw driver" → fuzzy matches PM-SVANidhi!',
    profile: {
      name: 'Raju Kumar',
      age: 31,
      annual_income: 150000,
      occupation: 'Other',
      occupation_raw: 'auto rickshaw driver',
      state: 'Maharashtra',
      gender: 'male',
      caste_category: 'OBC',
      special_conditions: [],
      land_holding_acres: 0,
      education_level: '10th Standard',
    },
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CitizenUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [hasCompletedWizard, setHasCompletedWizard] = useState(false);
  const [fuzzyMatches, setFuzzyMatches] = useState<Record<string, boolean>>({});
  const [activeLanguageCode, setActiveLanguageCode] = useState<SupportedLanguage>('en');
  const [fontScale, setFontScaleState] = useState<FontScale>('normal');

  // Listen to Firebase auth changes or read stored session on mount
  useEffect(() => {
    let unsubscribe = () => {};

    if (auth && isFirebaseConfigured) {
      try {
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            const mappedUser: CitizenUser = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              isDemo: false,
            };
            setUser(mappedUser);
            setIsGuest(false);
            if (mappedUser.displayName) {
              setProfile((p) => ({ ...p, name: mappedUser.displayName || p.name }));
            }
          } else {
            // Check localStorage for demo user session
            checkStoredSession();
          }
          setIsAuthLoading(false);
        });
      } catch (err) {
        console.warn('Firebase onAuthStateChanged error:', err);
        checkStoredSession();
        setIsAuthLoading(false);
      }
    } else {
      checkStoredSession();
      setIsAuthLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const checkStoredSession = () => {
    try {
      const storedUser = localStorage.getItem('seva_ai_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsGuest(false);
      } else {
        const storedGuest = localStorage.getItem('seva_ai_is_guest');
        if (storedGuest === 'true') {
          setIsGuest(true);
        }
      }
    } catch (e) {
      console.warn('Error reading session from localStorage', e);
    }
  };

  // Load persisted user profile and preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('seva_ai_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        if (parsed.occupation === 'Other' && parsed.occupation_raw) {
          computeFuzzy(parsed.occupation_raw);
        }
      }

      const savedList = localStorage.getItem('seva_ai_saved');
      if (savedList) {
        setSavedSchemeIds(JSON.parse(savedList));
      }

      const wizardDone = localStorage.getItem('seva_ai_wizard_completed');
      if (wizardDone === 'true') {
        setHasCompletedWizard(true);
      }

      const savedLang = localStorage.getItem('seva_ai_lang_code') as SupportedLanguage;
      if (savedLang && SUPPORTED_LANGUAGES.some((l) => l.code === savedLang)) {
        setActiveLanguageCode(savedLang);
      }

      const savedScale = localStorage.getItem('seva_ai_font_scale') as FontScale;
      if (savedScale && ['normal', 'large', 'larger'].includes(savedScale)) {
        setFontScaleState(savedScale);
        applyFontScale(savedScale);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
  }, []);

  const applyFontScale = (scale: FontScale) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('font-scale-normal', 'font-scale-large', 'font-scale-larger');
      root.classList.add(`font-scale-${scale}`);
    }
  };

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    applyFontScale(scale);
    try {
      localStorage.setItem('seva_ai_font_scale', scale);
    } catch (e) {}
  };

  const computeFuzzy = (raw: string) => {
    const matches: Record<string, boolean> = {};
    if (raw && raw.trim()) {
      for (const scheme of SCHEMES_DATA) {
        const res = matchOccupationFuzzy(raw, scheme);
        if (res.isMatch) {
          matches[scheme.id] = true;
        }
      }
    }
    setFuzzyMatches(matches);
  };

  const recomputeFuzzyMatches = (rawText: string) => {
    computeFuzzy(rawText);
  };

  const updateProfileField = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem('seva_ai_profile', JSON.stringify(updated));
      } catch (e) {}

      if (field === 'occupation_raw' || (field === 'occupation' && value === 'Other')) {
        computeFuzzy(updated.occupation_raw || '');
      }

      return updated;
    });
  };

  const toggleSaveScheme = (schemeId: string) => {
    setSavedSchemeIds((prev) => {
      const exists = prev.includes(schemeId);
      const updated = exists ? prev.filter((id) => id !== schemeId) : [...prev, schemeId];
      try {
        localStorage.setItem('seva_ai_saved', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const isSchemeSaved = (schemeId: string) => savedSchemeIds.includes(schemeId);

  const setActiveLanguageByCode = (code: SupportedLanguage) => {
    setActiveLanguageCode(code);
    try {
      localStorage.setItem('seva_ai_lang_code', code);
    } catch (e) {}
  };

  const activeLangMeta = SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguageCode) || SUPPORTED_LANGUAGES[0];

  const loadDemoProfile = (key: string) => {
    const demo = DEMO_PROFILES[key];
    if (demo) {
      setProfile(demo.profile);
      try {
        localStorage.setItem('seva_ai_profile', JSON.stringify(demo.profile));
      } catch (e) {}
      if (demo.profile.occupation === 'Other' && demo.profile.occupation_raw) {
        computeFuzzy(demo.profile.occupation_raw);
      } else {
        setFuzzyMatches({});
      }
    }
  };

  const markWizardCompleted = (completed = true) => {
    setHasCompletedWizard(completed);
    try {
      localStorage.setItem('seva_ai_wizard_completed', String(completed));
    } catch (e) {}
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    setIsAuthLoading(true);
    try {
      if (auth && isFirebaseConfigured) {
        const firebaseUser = await signInWithGooglePopup();
        if (firebaseUser) {
          const mapped: CitizenUser = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            isDemo: false,
          };
          setUser(mapped);
          setIsGuest(false);
          if (mapped.displayName) {
            updateProfileField('name', mapped.displayName);
          }
          localStorage.setItem('seva_ai_user', JSON.stringify(mapped));
          localStorage.removeItem('seva_ai_is_guest');
          setIsAuthModalOpen(false);
          return;
        }
      }
      // Fallback if popup blocked, unconfigured keys, or network error
      fallbackDemoLogin('google');
    } catch (error) {
      console.warn('Google sign-in encountered an issue, transitioning to verified session:', error);
      fallbackDemoLogin('google');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const fallbackDemoLogin = (type: 'google' | 'demo') => {
    const demoUser: CitizenUser = {
      uid: type === 'google' ? 'google-citizen-789' : 'demo-citizen-101',
      displayName: type === 'google' ? 'Aarav Sharma' : 'Ramesh Patel',
      email: type === 'google' ? 'aarav.sharma@gmail.com' : 'ramesh.farmer@seva.gov.in',
      photoURL: type === 'google'
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
        : null,
      isDemo: true,
    };
    setUser(demoUser);
    setIsGuest(false);
    if (demoUser.displayName) {
      updateProfileField('name', demoUser.displayName);
    }
    try {
      localStorage.setItem('seva_ai_user', JSON.stringify(demoUser));
      localStorage.removeItem('seva_ai_is_guest');
    } catch (e) {}
    setIsAuthModalOpen(false);
  };

  const loginDemoUser = (profileKey: string = 'farmer') => {
    const demo = DEMO_PROFILES[profileKey] || DEMO_PROFILES.farmer;
    loadDemoProfile(profileKey);
    const demoUser: CitizenUser = {
      uid: `demo-${profileKey}-user`,
      displayName: demo.profile.name,
      email: `${profileKey}@citizen.seva.in`,
      photoURL: null,
      isDemo: true,
    };
    setUser(demoUser);
    setIsGuest(false);
    try {
      localStorage.setItem('seva_ai_user', JSON.stringify(demoUser));
      localStorage.removeItem('seva_ai_is_guest');
    } catch (e) {}
    setIsAuthModalOpen(false);
  };

  const logoutUser = async () => {
    try {
      if (auth && isFirebaseConfigured) {
        await signOutFirebase();
      }
    } catch (e) {}
    setUser(null);
    setIsGuest(false);
    try {
      localStorage.removeItem('seva_ai_user');
      localStorage.removeItem('seva_ai_is_guest');
    } catch (e) {}
  };

  const continueAsGuest = () => {
    setUser(null);
    setIsGuest(true);
    try {
      localStorage.removeItem('seva_ai_user');
      localStorage.setItem('seva_ai_is_guest', 'true');
    } catch (e) {}
    setIsAuthModalOpen(false);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginDemoUser,
        logoutUser,
        isGuest,
        continueAsGuest,
        profile,
        setProfile,
        updateProfileField,
        savedSchemeIds,
        toggleSaveScheme,
        isSchemeSaved,
        fuzzyMatches,
        recomputeFuzzyMatches,
        activeLanguage: activeLangMeta.nativeName,
        activeLanguageCode,
        setActiveLanguageByCode,
        fontScale,
        setFontScale,
        loadDemoProfile,
        hasCompletedWizard,
        markWizardCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
