'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar }  from '@/components/layout/Topbar';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token  = useAuthStore(s => s.token);
  const user   = useAuthStore(s => s.user);
  const [hydrated, setHydrated]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) { router.replace('/login'); return; }
    if (user.role === 'dsa') router.replace('/dsa');
  }, [hydrated, token, user, router]);

  if (!hydrated || !token || !user || user.role === 'dsa') return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#111]">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden bg-white">
        <Topbar onMenuToggle={() => setMobileOpen(o => !o)} />
        <main className="flex-1 overflow-y-scroll p-6 sm:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
