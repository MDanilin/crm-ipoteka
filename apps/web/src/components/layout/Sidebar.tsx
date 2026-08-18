'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import type { UserRole } from '@crm/types';

interface NavItem {
  href:     string;
  labelKey: string;
  roles:    UserRole[];
  icon:     React.ReactNode;
}

const NAV_GROUPS: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: 'nav.groupMain',
    items: [
      {
        href: '/dashboard', labelKey: 'nav.dashboard',
        roles: ['admin','supervisor','manager','analyst'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
            <rect x="13" y="2" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
            <rect x="2" y="13" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
            <rect x="13" y="13" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          </svg>
        ),
      },
    ],
  },
  {
    titleKey: 'nav.groupSales',
    items: [
      {
        href: '/clients', labelKey: 'nav.clients',
        roles: ['admin','supervisor','manager','analyst'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M2 20c0-4 3.1-7 7-7s7 3 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="18" cy="8" r="3" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M21 20c0-2.8-1.8-5.2-4.3-6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        href: '/leads', labelKey: 'nav.leads',
        roles: ['admin','supervisor','manager','agent'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        href: '/campaigns', labelKey: 'nav.campaigns',
        roles: ['admin','supervisor','operator'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22 8V16M18 5V19M14 8V16M10 6V18M6 9V15M2 11V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        href: '/pipeline', labelKey: 'nav.pipeline',
        roles: ['admin','supervisor','manager'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 4h18l-7 8.5V20l-4-2v-5.5L3 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    titleKey: 'nav.groupWork',
    items: [
      {
        href: '/tasks', labelKey: 'nav.tasks',
        roles: ['admin','supervisor','manager'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M7 12l3.5 3.5L17 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        href: '/analytics', labelKey: 'nav.analytics',
        roles: ['admin','supervisor','analyst'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 18l5-6 4 4 5-8 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        href: '/sla', labelKey: 'nav.sla',
        roles: ['admin','supervisor','manager'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    titleKey: 'nav.groupManage',
    items: [
      {
        href: '/users', labelKey: 'nav.users',
        roles: ['admin','supervisor'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M3 21c0-5 4-9 9-9s9 4 9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        href: '/product-catalog', labelKey: 'nav.catalog',
        roles: ['admin'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
            <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
            <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
          </svg>
        ),
      },
      {
        href: '/admin', labelKey: 'nav.admin',
        roles: ['admin'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        href: '/settings', labelKey: 'nav.settings',
        roles: ['admin'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.6"/>
          </svg>
        ),
      },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { t }     = useTranslation();
  const user      = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);

  if (!user) return null;

  function logout() {
    clearAuth();
    router.replace('/login');
  }

  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('');

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[316px] shrink-0 flex-col border-r border-g20 bg-white px-3 py-4 h-screen overflow-y-auto scrollbar-thin transition-transform duration-300",
        "lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>

        {/* Brand */}
        <div className="border-b border-g20 px-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-g90 text-lg font-bold text-white select-none">И</div>
            <span className="text-[20px] font-bold tracking-[-0.04em]">Ипотека Банк</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-7 px-0 pt-8 flex-1">
          {NAV_GROUPS.map(group => {
            const visible = group.items.filter(item => item.roles.includes(user.role));
            if (!visible.length) return null;
            return (
              <div key={group.titleKey}>
                <p className="mb-3 px-3 text-[13px] uppercase tracking-[0.12em] text-g40">{t(group.titleKey)}</p>
                <div className="flex flex-col gap-1">
                  {visible.map(item => {
                    const active = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex h-[58px] items-center gap-5 rounded px-4 text-left text-[20px] font-normal transition-colors',
                          // Активный пункт — светло-синяя заливка и полоса
                          // слева (UzUsta Operations): синий значит
                          // «выбрано», а не бренд-акцент продукта.
                          active
                            ? 'bg-ac-bg font-semibold text-ac shadow-[inset_2px_0_0_var(--accent)]'
                            : 'text-g70 hover:bg-g5'
                        )}
                      >
                        <span className={cn(active ? 'text-ac' : 'text-g40')}>{item.icon}</span>
                        <span className="flex-1">{t(item.labelKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto border-t border-g20 px-3 pt-4 space-y-4">
          <LanguageSwitcher />
          <div className="flex items-center gap-3 px-1">
            <div className="grid size-10 place-items-center rounded-full bg-g10 border border-g30 text-xs font-bold text-g70 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-g90">{user.name}</p>
              <p className="text-xs text-g60">{t(`common.roles.${user.role}`)}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Выйти"
              className="text-g40 hover:text-g90 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 16H3a1 1 0 01-1-1V3a1 1 0 011-1h4M12 13l4-4-4-4M16 9H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
