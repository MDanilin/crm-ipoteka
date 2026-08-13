'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import type { LoginResponse } from '@crm/types';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

function fmtLocal(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (!d) return '';
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0,2)} ${d.slice(2,5)}-${d.slice(5)}`;
  return `${d.slice(0,2)} ${d.slice(2,5)}-${d.slice(5,7)}-${d.slice(7)}`;
}

function rawDigits(local: string) {
  return local.replace(/\D/g, '');
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-full bg-[#111] text-lg font-bold text-white select-none">И</div>
      <span className="text-[20px] font-bold tracking-[-0.04em]">Ипотека Банк</span>
    </div>
  );
}

export default function LoginPage() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const { t }   = useTranslation();

  const [mode, setMode] = useState<'staff' | 'agent'>('staff');

  // OTP flow (staff)
  const [step,    setStep]    = useState<'phone' | 'otp'>('phone');
  const [local,   setLocal]   = useState('');
  const [otpVal,  setOtpVal]  = useState('');
  const [devOtp,  setDevOtp]  = useState('');

  // Password flow (agent)
  const [agentLogin, setAgentLogin] = useState('');
  const [agentPass,  setAgentPass]  = useState('');

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const phoneRef = useRef<HTMLInputElement>(null);
  const otpRef   = useRef<HTMLInputElement>(null);

  const fullPhone   = `+998 ${local}`.trim();
  const localDigits = rawDigits(local);
  const phoneReady  = localDigits.length === 9;

  function switchMode(m: 'staff' | 'agent') {
    setMode(m);
    setError('');
    setStep('phone');
    setLocal(''); setOtpVal(''); setDevOtp('');
    setAgentLogin(''); setAgentPass('');
  }

  async function sendOtp(phone: string) {
    setLoading(true); setError('');
    try {
      const res = await api.post<{ success: boolean; dev_otp?: string }>('/auth/send-otp', { phone });
      if (res.dev_otp) setDevOtp(res.dev_otp);
      setOtpVal('');
      setStep('otp');
      setTimeout(() => otpRef.current?.focus(), 80);
    } catch (e: unknown) {
      setError((e as { error?: string }).error ?? t('login.errDefault'));
    } finally { setLoading(false); }
  }

  async function handleSendOtp() {
    if (!phoneReady) return;
    await sendOtp(fullPhone);
  }

  async function handleVerifyOtp(code: string) {
    setLoading(true); setError('');
    try {
      const res = await api.post<LoginResponse>('/auth/verify-otp', { phone: fullPhone, code });
      localStorage.setItem('crm_token', res.token);
      setAuth(res.token, res.user);
      if (res.user.role === 'dsa') { router.replace('/dsa'); return; }
      router.replace('/dashboard');
    } catch (e: unknown) {
      setError((e as { error?: string }).error ?? t('login.errCode'));
      setOtpVal('');
      setTimeout(() => otpRef.current?.focus(), 80);
    } finally { setLoading(false); }
  }

  function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpVal(val);
    setError('');
    if (val.length === 6) handleVerifyOtp(val);
  }

  async function handleAgentLogin() {
    if (!agentLogin || !agentPass) return;
    setLoading(true); setError('');
    try {
      const res = await api.post<LoginResponse>('/auth/login', { login: agentLogin, password: agentPass });
      if (res.user.role !== 'agent') {
        setError(t('login.agentOnly'));
        setLoading(false); return;
      }
      localStorage.setItem('crm_token', res.token);
      setAuth(res.token, res.user);
      router.replace('/leads');
    } catch (e: unknown) {
      setError((e as { error?: string }).error ?? t('login.errCreds'));
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-white p-0 sm:p-8 lg:p-[60px]">
      <section className="relative flex min-h-[calc(100vh-0px)] sm:min-h-[calc(100vh-64px)] lg:min-h-[calc(100vh-120px)] flex-col bg-[#fcfcfc] px-8 py-7 sm:px-12 lg:px-[9vw]">

        <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
          <Brand />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-[#f3f3f3] rounded-full p-1">
              <button
                onClick={() => switchMode('staff')}
                className={`h-8 px-4 rounded-full text-sm font-semibold transition-all ${mode === 'staff' ? 'bg-[#111] text-white' : 'text-[#888] hover:text-[#111]'}`}
              >
                {t('login.staffMode')}
              </button>
              <button
                onClick={() => switchMode('agent')}
                className={`h-8 px-4 rounded-full text-sm font-semibold transition-all ${mode === 'agent' ? 'bg-[#111] text-white' : 'text-[#888] hover:text-[#111]'}`}
              >
                {t('login.agentMode')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[900px]">

            {/* ── AGENT MODE: login + password ── */}
            {mode === 'agent' ? (
              <>
                <p className="mb-2 text-[16px] font-semibold">{t('login.agentTitle')}</p>
                <p className="mb-8 text-sm text-[#aaa]">{t('login.agentSubtitle')}</p>

                <div className="space-y-4">
                  <div>
                    <label className="field-label">{t('login.loginLabel')}</label>
                    <input
                      value={agentLogin}
                      onChange={e => { setAgentLogin(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleAgentLogin()}
                      className="form-input"
                      placeholder="buhgalterplus"
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label className="field-label">{t('login.passLabel')}</label>
                    <input
                      type="password"
                      value={agentPass}
                      onChange={e => { setAgentPass(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleAgentLogin()}
                      className="form-input"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {error && <p className="mt-3 text-sm text-[#e1261c]">{error}</p>}

                <div className="mt-6">
                  <button
                    onClick={handleAgentLogin}
                    disabled={!agentLogin || !agentPass || loading}
                    className="flex h-11 items-center gap-2 rounded-full bg-[#111] px-5 text-sm font-semibold text-white hover:bg-[#333] transition-colors disabled:opacity-40"
                  >
                    {loading ? t('login.loadingBtn') : t('login.submitBtn')}
                  </button>
                </div>
              </>
            ) : (
            /* ── STAFF MODE: phone + OTP ── */
              step === 'phone' ? (
                <>
                  <p className="mb-4 text-[16px] font-semibold">{t('login.staffTitle')}</p>
                  <div
                    className="flex items-center gap-3 cursor-text"
                    onClick={() => phoneRef.current?.focus()}
                  >
                    <span className="text-[clamp(42px,6vw,78px)] font-medium leading-none tracking-[-0.08em] select-none shrink-0">+998</span>
                    <input
                      ref={phoneRef}
                      type="tel" inputMode="numeric" autoFocus
                      value={local}
                      onChange={e => {
                        const fmt = fmtLocal(e.target.value);
                        setLocal(fmt);
                        setError('');
                        if (rawDigits(fmt).length === 9) sendOtp(`+998 ${fmt}`.trim());
                      }}
                      onKeyDown={e => { if (e.key === 'Enter' && phoneReady) handleSendOtp(); }}
                      placeholder="XX XXX-XX-XX"
                      className="min-w-0 flex-1 bg-transparent text-[clamp(42px,6vw,78px)] font-medium leading-none tracking-[-0.08em] outline-none placeholder:text-[#e3e3e3]"
                    />
                  </div>
                  {loading && <p className="mt-4 text-sm text-[#aaa]">{t('login.sendingCode')}</p>}
                  {error && <p className="mt-3 text-sm text-[#e1261c]">{error}</p>}
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setStep('phone'); setOtpVal(''); setDevOtp(''); setError(''); }}
                    className="mb-6 flex h-11 items-center gap-2 rounded-full bg-[#f2f2f2] px-5 text-sm font-semibold text-[#111] hover:bg-[#e8e8e8] transition-colors"
                  >
                    ← {fullPhone}
                  </button>
                  <p className="mb-4 text-[16px] font-semibold">{t('login.enterCode')}</p>
                  <div className="border-b-2 border-[#111] pb-3">
                    <input
                      ref={otpRef} type="text" inputMode="numeric" autoFocus
                      value={otpVal}
                      onChange={handleOtpChange}
                      placeholder="000000" maxLength={6}
                      className="w-full bg-transparent text-[clamp(52px,7vw,88px)] font-medium leading-none tracking-[0.12em] outline-none placeholder:text-[#e3e3e3]"
                    />
                  </div>
                  {error && <p className="mt-3 text-sm text-[#e1261c]">{error}</p>}
                  {loading && <p className="mt-3 text-sm text-[#aaa]">{t('login.verifying')}</p>}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => { setDevOtp(''); handleSendOtp(); }}
                      className="flex h-11 items-center gap-2 rounded-full bg-[#f2f2f2] px-5 text-sm font-semibold text-[#111] hover:bg-[#e8e8e8] transition-colors"
                    >
                      {t('login.resend')}
                    </button>
                    {devOtp && (
                      <div className="flex h-11 items-center gap-2 rounded-full bg-[#fef3c7] border border-[#fcd34d] px-4 text-sm">
                        <span className="font-mono font-bold tracking-widest text-[#92400e]">{devOtp}</span>
                        <span className="text-[#b45309] text-xs">dev</span>
                      </div>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>

        <footer className="mt-8 flex items-center justify-between text-xs text-[#aaa]">
          <span>{t('login.copyright')}</span>
          <a href="#" className="hover:text-[#111] transition-colors">{t('login.restoreAccess')}</a>
        </footer>
      </section>
    </main>
  );
}
