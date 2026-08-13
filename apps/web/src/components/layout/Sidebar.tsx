'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';
import type { UserRole } from '@crm/types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin:      'Администратор',
  supervisor: 'Руководитель',
  manager:    'Менеджер',
  analyst:    'Аналитик',
  agent:      'Агент',
  operator:   'Оператор',
  dsa:        'DSA',
};

interface NavItem {
  href:  string;
  label: string;
  roles: UserRole[];
  icon:  React.ReactNode;
  alert?: boolean;
}

const NAV_GROUPS = [
  {
    title: 'Основное',
    items: [
      {
        href: '/dashboard', label: 'Дашборд',
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
    title: 'Продажи',
    items: [
      {
        href: '/clients', label: 'Клиенты',
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
        href: '/leads', label: 'Лиды',
        roles: ['admin','supervisor','manager','agent'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        href: '/campaigns', label: 'Кампании',
        roles: ['admin','supervisor','manager','operator'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22 8V16M18 5V19M14 8V16M10 6V18M6 9V15M2 11V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        href: '/pipeline', label: 'Воронка',
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
    title: 'Работа',
    items: [
      {
        href: '/tasks', label: 'Задачи',
        roles: ['admin','supervisor','manager'] as UserRole[],
        alert: true,
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M7 12l3.5 3.5L17 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        href: '/analytics', label: 'Аналитика',
        roles: ['admin','supervisor','analyst'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 18l5-6 4 4 5-8 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        href: '/sla', label: 'SLA',
        roles: ['admin','supervisor','manager'] as UserRole[],
        alert: true,
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
    title: 'Управление',
    items: [
      {
        href: '/users', label: 'Сотрудники',
        roles: ['admin','supervisor'] as UserRole[],
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M3 21c0-5 4-9 9-9s9 4 9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        href: '/product-catalog', label: 'Каталог продуктов',
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
    ],
  },
];

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const user      = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);

  if (!user) return null;

  function logout() {
    clearAuth();
    router.replace('/login');
  }

  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('');

  return (
    <aside className="flex w-[316px] shrink-0 flex-col border-r border-[#ececec] bg-white px-3 py-4 h-screen overflow-y-auto scrollbar-thin">

      {/* Brand */}
      <div className="border-b border-[#eeeeee] px-4 pb-6">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-[#111] text-lg font-bold text-white select-none">И</div>
          <span className="text-[20px] font-bold tracking-[-0.04em]">Ипотека Банк</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-7 px-0 pt-8 flex-1">
        {NAV_GROUPS.map(group => {
          const visible = group.items.filter(item => item.roles.includes(user.role));
          if (!visible.length) return null;
          return (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[13px] uppercase tracking-[0.12em] text-[#b3b3b3]">{group.title}</p>
              <div className="flex flex-col gap-1">
                {visible.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex h-[58px] items-center gap-5 rounded-xl px-4 text-left text-[20px] font-normal transition-colors',
                        active
                          ? 'bg-[#f3f3f3] font-semibold text-[#111]'
                          : 'text-[#6f8095] hover:bg-[#fafafa]'
                      )}
                    >
                      <span className={cn(active ? 'text-[#111]' : 'text-[#bcbcbc]')}>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto border-t border-[#eeeeee] px-3 pt-5">
        <div className="mt-3 flex items-center gap-3 px-1">
          <div className="grid size-10 place-items-center rounded-full bg-[#f3dcd8] text-xs font-bold text-[#7c3f36] flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#111]">{user.name}</p>
            <p className="text-xs text-[#9a8584]">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Выйти"
            className="text-[#bcbcbc] hover:text-[#111] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 16H3a1 1 0 01-1-1V3a1 1 0 011-1h4M12 13l4-4-4-4M16 9H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

    </aside>
  );
}
