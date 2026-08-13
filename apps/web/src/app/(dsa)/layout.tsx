'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function DsaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user   = useAuthStore(s => s.user);
  const token  = useAuthStore(s => s.token);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) { router.replace('/login'); return; }
    if (user && user.role !== 'dsa') router.replace('/dashboard');
  }, [hydrated, token, user, router]);

  if (!hydrated || !token || (user && user.role !== 'dsa')) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f7f7f7] max-w-md mx-auto">
      <div className="flex flex-col flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
