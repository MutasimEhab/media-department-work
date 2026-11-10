import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const WelcomeGreeting: React.FC = () => {
  const { currentUser, welcomeGreetingOpen, dismissWelcomeGreeting } = useApp();
  useEscapeKey(welcomeGreetingOpen, dismissWelcomeGreeting);
  useEffect(() => {
    if (!welcomeGreetingOpen) return;
    const timer = window.setTimeout(dismissWelcomeGreeting, 7000);
    return () => window.clearTimeout(timer);
  }, [welcomeGreetingOpen, dismissWelcomeGreeting]);
  if (!welcomeGreetingOpen) return null;

  return <div dir="rtl" className="welcome-overlay fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6">
    <div aria-hidden="true" className="welcome-backdrop absolute inset-0" />
    <section aria-label="رسالة ترحيب" aria-live="polite" role="status" className="welcome-greeting-panel relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/20 bg-white shadow-dialog ring-1 ring-black/10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-brand-magenta via-brand-plum to-brand-magenta" />
      <button type="button" onClick={dismissWelcomeGreeting} className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-lightGray/70 text-brand-charcoal transition hover:bg-brand-lightGray focus:outline-none focus:ring-2 focus:ring-brand-plum" aria-label="إغلاق رسالة الترحيب"><X className="h-4 w-4" /></button>
      <div className="relative flex flex-col items-center px-6 pb-7 pt-9 text-center sm:px-9 sm:pb-9 sm:pt-11">
        <div className="relative mb-5 h-[5.25rem] w-[5.25rem]">
          <div className="absolute -inset-2 rounded-[1.8rem] bg-brand-magenta/10 blur-sm" />
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.5rem] border border-brand-plum/15 bg-brand-plum text-3xl font-bold text-white shadow-card">
            {currentUser.avatar ? <img src={currentUser.avatar} alt="" className="h-full w-full object-cover" /> : currentUser.arabicName.charAt(0)}
          </div>
          <span className="absolute -bottom-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-brand-magenta text-white shadow-sm"><Sparkles className="h-3.5 w-3.5" /></span>
        </div>
        <p className="text-xs font-semibold text-brand-plum">مرحباً بك في نظام إدارة أعمال دائرة الإعلام</p>
        <h2 className="mt-2 text-xl font-bold text-brand-darkText sm:text-2xl">أهلاً وسهلاً، {currentUser.arabicName}</h2>
        <p className="mt-2 max-w-sm text-sm text-brand-charcoal">{currentUser.jobTitleAr} · نتمنى لك يوماً موفقاً.</p>
      </div>
      <div className="h-1 w-full bg-brand-plum/10"><div className="welcome-progress h-full bg-brand-magenta" /></div>
    </section>
  </div>;
};
