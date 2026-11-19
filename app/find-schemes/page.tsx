'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Briefcase,
  Calendar,
  IndianRupee,
  Users,
  Mic,
  MicOff,
  Navigation,
  CheckCircle2,
  Sprout,
  Store,
  GraduationCap,
  Hammer,
  ShoppingBag,
  Sparkles,
  Heart,
  ChevronRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { OccupationCategory, UserProfile } from '@/lib/types';
import { SCHEMES_DATA } from '@/lib/schemes-data';
import { rankSchemesForProfile } from '@/lib/rule-engine';
import { SchemeCard } from '@/components/SchemeCard';

const STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const OCCUPATION_CARDS: Array<{
  id: OccupationCategory;
  label: string;
  icon: any;
  desc: string;
}> = [
  { id: 'Farmer / Agriculturist', label: 'Farmer / Kisaan', icon: Sprout, desc: 'Cultivates land or grows crops' },
  { id: 'Unorganized Sector Worker / Daily Wage Labourer', label: 'Daily Wage / Labourer', icon: Hammer, desc: 'Construction, factory, or informal work' },
  { id: 'Self-Employed / Street Vendor', label: 'Street Vendor / Self-Employed', icon: ShoppingBag, desc: 'Hawkers, stalls, micro-service work' },
  { id: 'Student', label: 'Student', icon: GraduationCap, desc: 'School, college, or university' },
  { id: 'Entrepreneur / Small Business Owner', label: 'Small Business / MSME', icon: Store, desc: 'Shop owner or enterprise operator' },
  { id: 'Senior Citizen', label: 'Senior Citizen', icon: Users, desc: 'Retired or above 60 years' },
  { id: 'Unemployed / Job-Seeker', label: 'Looking for a Job', icon: Search, desc: 'Seeking apprenticeship or training' },
  { id: 'Other', label: 'Other Work', icon: Briefcase, desc: 'Any other occupation' },
];

export default function FindSchemesWizardPage() {
  const { profile, updateProfileField, fuzzyMatches, markWizardCompleted } = useAuth();
  const { locale, t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Form State initialized from context (state is empty by default so it's not preselected)
  const [selectedState, setSelectedState] = useState<string>(profile.state === 'All India' ? '' : profile.state);
  const [stateSearch, setStateSearch] = useState('');
  const [selectedOccupation, setSelectedOccupation] = useState<OccupationCategory>(profile.occupation);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>(
    profile.age ? (profile.age <= 25 ? 'youth' : profile.age >= 60 ? 'senior' : 'adult') : 'adult'
  );
  const [selectedGender, setSelectedGender] = useState<'any' | 'male' | 'female' | 'transgender'>(profile.gender || 'any');
  const [selectedIncome, setSelectedIncome] = useState<number>(profile.annual_income || 180000);

  // Filtered States based on search
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return STATES;
    return STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [stateSearch]);

  // Voice Input for current step
  const handleVoiceAnswer = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        bn: 'bn-IN',
        ta: 'ta-IN',
      };
      recognition.lang = langMap[locale] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setIsListening(false);

        if (currentStep === 1) {
          const match = STATES.find((st) => transcript.includes(st.toLowerCase()));
          if (match) setSelectedState(match);
        } else if (currentStep === 2) {
          if (transcript.includes('farmer') || transcript.includes('kisan') || transcript.includes('কৃষক') || transcript.includes('किसान')) {
            setSelectedOccupation('Farmer / Agriculturist');
          } else if (transcript.includes('student') || transcript.includes('छात्र') || transcript.includes('ছাত্র')) {
            setSelectedOccupation('Student');
          } else if (transcript.includes('vendor') || transcript.includes('shop') || transcript.includes('दुकान')) {
            setSelectedOccupation('Self-Employed / Street Vendor');
          }
        } else if (currentStep === 3) {
          const num = parseInt(transcript.replace(/\D/g, ''), 10);
          if (num > 0) {
            if (num <= 25) setSelectedAgeGroup('youth');
            else if (num >= 60) setSelectedAgeGroup('senior');
            else setSelectedAgeGroup('adult');
          }
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Geolocation Handler
  const handleUseLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Fallback default state detected if geocoding is client-side
        if (!selectedState) {
          setSelectedState('Delhi');
        }
      },
      (err) => {
        alert('Please select your state from the list.');
      }
    );
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Save all responses to context
      updateProfileField('state', selectedState || 'All India');
      updateProfileField('occupation', selectedOccupation);
      updateProfileField('gender', selectedGender);
      updateProfileField('annual_income', selectedIncome);
      const ageVal = selectedAgeGroup === 'youth' ? 22 : selectedAgeGroup === 'senior' ? 65 : 40;
      updateProfileField('age', ageVal);
      markWizardCompleted(true);

      setIsCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Compile results
  const potentialMatches = useMemo(() => {
    const ageVal = selectedAgeGroup === 'youth' ? 22 : selectedAgeGroup === 'senior' ? 65 : 40;
    const tempProfile: UserProfile = {
      ...profile,
      state: selectedState || 'All India',
      occupation: selectedOccupation,
      gender: selectedGender,
      annual_income: selectedIncome,
      age: ageVal,
    };
    return rankSchemesForProfile(SCHEMES_DATA, tempProfile, fuzzyMatches);
  }, [profile, selectedState, selectedOccupation, selectedGender, selectedIncome, selectedAgeGroup, fuzzyMatches]);

  const canApplyList = potentialMatches.filter((item) => item.verdict.status === 'Eligible');
  const checkThingsList = potentialMatches.filter((item) => item.verdict.status === 'Needs More Info');

  return (
    <div className="w-full max-w-[480px] mx-auto px-4 py-5 pb-32 animate-in fade-in duration-150">
      {!isCompleted ? (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-bold text-slate-600 dark:text-slate-300">
              <span className="text-[#D9531E] font-extrabold">
                {t('wizard.questionOf', { current: currentStep, total: 5 }) || `Question ${currentStep} of 5`}
              </span>
              <button
                type="button"
                onClick={handleVoiceAnswer}
                aria-label={isListening ? 'Stop listening' : 'Answer question by voice'}
                className={`touch-target flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-[#D9531E] text-white animate-pulse'
                    : 'bg-orange-50 dark:bg-orange-950/40 text-[#D9531E] border border-orange-200 dark:border-orange-800'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListening ? 'Listening...' : 'Answer by voice'}</span>
              </button>
            </div>

            {/* Simple Visual Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-[#0E2040] dark:bg-white rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* Question 1: Where do you live?                          */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {t('wizard.statePrompt') || 'Where do you live?'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {t('wizard.stateDesc') || 'Choose the state where you live.'}
                </p>
              </div>

              {/* Use My Location Button */}
              <button
                type="button"
                onClick={handleUseLocation}
                className="touch-target w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-sm hover:border-[#0E2040] transition-colors"
              >
                <Navigation className="w-4 h-4 text-[#D9531E]" />
                <span>{t('wizard.useLocation') || 'Use my location'}</span>
              </button>

              {/* State Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  placeholder={t('wizard.statePlaceholder') || 'Search your State or UT...'}
                  className="touch-target w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white text-base font-medium focus:outline-none focus:border-[#0E2040]"
                />
              </div>

              {/* State Selection List */}
              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredStates.map((st) => {
                  const isSelected = selectedState === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedState(st)}
                      className={`touch-target flex items-center justify-between p-3.5 rounded-2xl border-2 text-left font-bold text-base transition-all ${
                        isSelected
                          ? 'border-[#0E2040] dark:border-white bg-slate-100 dark:bg-slate-800 text-[#0E2040] dark:text-white shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{st}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#D9531E]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* Question 2: What work do you do?                        */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {t('wizard.occPrompt') || 'What work do you do?'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {t('wizard.occDesc') || 'Choose your main work to find benefits.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {OCCUPATION_CARDS.map((occ) => {
                  const Icon = occ.icon;
                  const isSelected = selectedOccupation === occ.id;

                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setSelectedOccupation(occ.id)}
                      className={`touch-target flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[#0E2040] dark:border-white bg-slate-100 dark:bg-slate-800 text-[#0E2040] dark:text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#0E2040] text-white dark:bg-white dark:text-[#0E2040]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <span className="block font-black text-base leading-tight">
                          {occ.label}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {occ.desc}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#D9531E] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* Question 3: How old are you?                            */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {t('wizard.agePrompt') || 'How old are you?'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {t('wizard.ageDesc') || 'Choose your age group.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'youth', label: '18 – 25 years', sub: 'Youth & Students', icon: GraduationCap },
                  { id: 'adult', label: '26 – 59 years', sub: 'Working Age Adults', icon: Briefcase },
                  { id: 'senior', label: '60 years and above', sub: 'Senior Citizens & Elders', icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedAgeGroup === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAgeGroup(item.id)}
                      className={`touch-target flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[#0E2040] dark:border-white bg-slate-100 dark:bg-slate-800 text-[#0E2040] dark:text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#0E2040] text-white dark:bg-white dark:text-[#0E2040]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <span className="block font-black text-lg leading-tight">{item.label}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#D9531E] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* Question 4: What is your gender?                        */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {t('wizard.genderPrompt') || 'What is your gender?'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {t('wizard.genderDesc') || 'Some schemes are specifically for women or girls.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'female', label: 'Female / Woman', desc: 'Unlock women-focused welfare and maternal benefits', icon: Heart },
                  { id: 'male', label: 'Male / Man', desc: 'Standard central and state schemes', icon: Users },
                  { id: 'any', label: 'All / Prefer not to say', desc: 'View universal schemes for all citizens', icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedGender === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedGender(item.id as any)}
                      className={`touch-target flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[#0E2040] dark:border-white bg-slate-100 dark:bg-slate-800 text-[#0E2040] dark:text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#0E2040] text-white dark:bg-white dark:text-[#0E2040]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <span className="block font-black text-lg leading-tight">{item.label}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#D9531E] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* Question 5: Family Annual Income                        */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {t('wizard.incomePrompt') || 'What is your family income?'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {t('wizard.incomeDesc') || 'Choose your approximate yearly family income.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 80000, label: 'Below ₹1 Lakh', sub: 'Eligible for low-income & BPL benefits' },
                  { value: 200000, label: '₹1 Lakh to ₹3 Lakh', sub: 'Eligible for majority of welfare subsidies' },
                  { value: 500000, label: '₹3 Lakh to ₹8 Lakh', sub: 'Eligible for scholarships & small business loans' },
                  { value: 900000, label: 'Above ₹8 Lakh', sub: 'General category benefits' },
                ].map((item) => {
                  const isSelected = selectedIncome === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelectedIncome(item.value)}
                      className={`touch-target flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[#0E2040] dark:border-white bg-slate-100 dark:bg-slate-800 text-[#0E2040] dark:text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#0E2040] text-white dark:bg-white dark:text-[#0E2040]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        <IndianRupee className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <span className="block font-black text-lg leading-tight">{item.label}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#D9531E] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fixed Bottom Action Bar */}
          <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 dark:bg-[#0B1120]/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md py-3 px-4 shadow-xl">
            <div className="max-w-md md:max-w-xl mx-auto flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="touch-target px-5 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-base hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="touch-target flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-[#0E2040] font-black text-base shadow-sm transition-all cursor-pointer"
              >
                <span>{currentStep === 5 ? (t('wizard.seeResults') || 'See schemes that match you') : (t('wizard.continue') || 'Continue')}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {t('wizard.resultsTitle') || 'Schemes that match you'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                Based on your answers ({selectedOccupation}, {selectedState || 'All India'}).
              </p>
            </div>

            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentStep(1);
              }}
              className="touch-target flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Change</span>
            </button>
          </div>

          {/* Scheme Cards */}
          <div className="space-y-3">
            {canApplyList.map(({ scheme, verdict }) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                verdict={verdict}
                showBadge={true}
                source="results"
              />
            ))}

            {checkThingsList.map(({ scheme, verdict }) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                verdict={verdict}
                showBadge={true}
                source="results"
              />
            ))}
          </div>

          <div className="pt-3 text-center">
            <Link
              href="/dashboard?source=browse"
              className="touch-target inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm hover:border-[#0E2040]"
            >
              <span>View all available schemes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
