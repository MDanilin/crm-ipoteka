// Shared primitives for UzUsta app screens
// Brand tokens kept consistent with the landing (mandarin accent, Manrope+Inter)

const UZ = {
  bg: '#f4f5f1',
  card: '#ffffff',
  ink: '#0e1a18',
  ink2: '#2a3936',
  ink3: '#5a6864',
  inkMute: '#8a9591',
  line: 'rgba(14, 26, 24, 0.08)',
  lineStrong: 'rgba(14, 26, 24, 0.14)',
  accent: '#ff6b35',
  accentDeep: '#d94d1a',
  accent2: '#ffb547',
  emerald: '#1f9d6e',
  emeraldSoft: '#e3f5ec',
  sky: '#4a90e2',
  skySoft: '#e8f0fb',
  pink: '#ff8fa3',
  pinkSoft: '#ffe4ea',
  gold: '#ffc94a',
  serif: "'Manrope', 'Inter', system-ui, sans-serif",
  sans: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// ─── i18n strings for the app ──────────────────────────────────────────
const APP_I18N = {
  ru: {
    // global
    back: 'Назад',
    next: 'Далее',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    // role badges
    client: 'Клиент',
    master: 'Мастер',
    // tabs
    tabHome: 'Главная',
    tabOrders: 'Заказы',
    tabChat: 'Чат',
    tabProfile: 'Профиль',
    tabFeed: 'Заявки',
    tabActive: 'Активный',
    tabEarn: 'Доход',
    // categories
    catPlumb: 'Сантехника',
    catElec: 'Электрика',
    catClean: 'Уборка',
    catAC: 'Кондиционеры',
    catAppl: 'Техника',
    catFurn: 'Сборка',
    catPaint: 'Покраска',
    catWeld: 'Сварка',
    // home
    helloMorning: 'Доброе утро',
    whatToday: 'Что починим сегодня?',
    searchPh: 'Опишите задачу или скажите голосом',
    popular: 'Популярные категории',
    recent: 'Недавние заказы',
    nearbyPros: 'Мастера рядом',
    seeAll: 'Все',
    urgent: 'Срочный вызов',
    urgentSub: 'Мастер за 30 минут',
    aiHelp: 'AI-помощник',
    aiHelpSub: 'Опишите голосом или фото',
    // create order
    newOrder: 'Новый заказ',
    describeTask: 'Опишите задачу',
    addPhotos: 'Добавить фото',
    selectAddr: 'Адрес',
    selectTime: 'Когда нужно',
    selectTimeNow: 'Сейчас',
    selectTime2h: 'Через 2 часа',
    selectTimeTmr: 'Завтра',
    selectTimePick: 'Выбрать дату',
    estPrice: 'Примерная цена',
    publish: 'Опубликовать',
    publishingTo: 'Получим отклики за 2 минуты',
    // matches
    matches: 'Отклики',
    waiting: 'Ждём мастеров…',
    matchesGot: 'отклика за 1 минуту 42 сек',
    rating: 'рейтинг',
    arriveIn: 'приедет за',
    jobs: 'заказов',
    chooseMaster: 'Выбрать',
    // master profile
    portfolio: 'Портфолио',
    reviews: 'Отзывы',
    aboutMe: 'О мастере',
    inTopRated: 'Топ-рейтинг',
    // tracking
    onTheWay: 'Мастер в пути',
    arrives: 'Приедет в',
    callMaster: 'Позвонить',
    cancelOrder: 'Отменить заказ',
    // chat
    typeMsg: 'Сообщение…',
    online: 'в сети',
    // payment
    payTitle: 'Оплата',
    payMethod: 'Способ оплаты',
    workCost: 'Работа',
    serviceFee: 'Сервисный сбор',
    total: 'К оплате',
    payNow: 'Оплатить',
    safeDeal: 'Защищённая сделка — деньги уйдут мастеру после подтверждения',
    // rating
    howWas: 'Как прошло?',
    leaveReview: 'Оставить отзыв',
    sendReview: 'Отправить',
    // history
    historyTitle: 'История заказов',
    completed: 'Выполнен',
    cancelled: 'Отменён',
    // profile
    myAddresses: 'Мои адреса',
    payMethods: 'Способы оплаты',
    notifications: 'Уведомления',
    language: 'Язык',
    support: 'Поддержка',
    referral: 'Пригласить друга',
    logout: 'Выйти',
    // master side
    feedTitle: 'Новые заявки',
    feedSub: 'Откликайтесь на подходящие',
    nearYou: 'рядом с вами',
    sendOffer: 'Откликнуться',
    yourOffer: 'Ваше предложение',
    eta: 'Время приезда',
    activeOrder: 'Активный заказ',
    startJob: 'Начать работу',
    finishJob: 'Завершить',
    earnTitle: 'Заработок',
    today: 'Сегодня',
    week: 'Неделя',
    month: 'Месяц',
    payouts: 'Выплаты',
    withdraw: 'Вывести',
    masterStats: 'Статистика',
    completeRate: 'Выполнено',
    avgRating: 'Рейтинг',
    responseTime: 'Отклик',
    // onboarding
    onbWelcome: 'Добро пожаловать в UzUsta',
    onbWelcomeSub: 'Мастер на любую задачу — за 2 минуты',
    onbStep1: 'Опишите задачу',
    onbStep1Sub: 'Голосом, текстом или фото',
    onbStep2: 'Получите отклики',
    onbStep2Sub: 'Подходящие мастера за 2 минуты',
    onbStep3: 'Оплатите безопасно',
    onbStep3Sub: 'Деньги уйдут мастеру после работы',
    getStarted: 'Начать',
    skip: 'Пропустить',
    // master onb
    onbMasterWelcome: 'Зарабатывайте с UzUsta',
    onbMasterSub: 'Платформа №1 для мастеров в Узбекистане',
    onbMasterStep1: 'Заполните профиль',
    onbMasterStep1Sub: 'Опыт, специализация, фото работ',
    onbMasterStep2: 'Принимайте заявки',
    onbMasterStep2Sub: 'Только подходящие задачи рядом с вами',
    onbMasterStep3: 'Получайте оплату',
    onbMasterStep3Sub: 'Каждую неделю — на карту или Click',
  },
  en: {
    back: 'Back',
    next: 'Next',
    cancel: 'Cancel',
    confirm: 'Confirm',
    client: 'Client',
    master: 'Pro',
    tabHome: 'Home',
    tabOrders: 'Orders',
    tabChat: 'Chat',
    tabProfile: 'Profile',
    tabFeed: 'Jobs',
    tabActive: 'Active',
    tabEarn: 'Earn',
    catPlumb: 'Plumbing',
    catElec: 'Electrical',
    catClean: 'Cleaning',
    catAC: 'AC',
    catAppl: 'Appliance',
    catFurn: 'Assembly',
    catPaint: 'Painting',
    catWeld: 'Welding',
    helloMorning: 'Good morning',
    whatToday: 'What shall we fix today?',
    searchPh: 'Describe the task or use voice',
    popular: 'Popular categories',
    recent: 'Recent orders',
    nearbyPros: 'Pros near you',
    seeAll: 'See all',
    urgent: 'Urgent',
    urgentSub: 'Pro in 30 minutes',
    aiHelp: 'AI assistant',
    aiHelpSub: 'Voice or photo input',
    newOrder: 'New order',
    describeTask: 'Describe the task',
    addPhotos: 'Add photos',
    selectAddr: 'Address',
    selectTime: 'When',
    selectTimeNow: 'Now',
    selectTime2h: 'In 2 hours',
    selectTimeTmr: 'Tomorrow',
    selectTimePick: 'Pick date',
    estPrice: 'Estimated price',
    publish: 'Publish',
    publishingTo: 'Get offers in 2 minutes',
    matches: 'Offers',
    waiting: 'Waiting for pros…',
    matchesGot: 'offers in 1 min 42 sec',
    rating: 'rating',
    arriveIn: 'arrives in',
    jobs: 'jobs',
    chooseMaster: 'Choose',
    portfolio: 'Portfolio',
    reviews: 'Reviews',
    aboutMe: 'About',
    inTopRated: 'Top rated',
    onTheWay: 'Pro on the way',
    arrives: 'Arrives at',
    callMaster: 'Call',
    cancelOrder: 'Cancel order',
    typeMsg: 'Message…',
    online: 'online',
    payTitle: 'Payment',
    payMethod: 'Payment method',
    workCost: 'Work',
    serviceFee: 'Service fee',
    total: 'Total',
    payNow: 'Pay',
    safeDeal: 'Protected deal — funds released after you confirm',
    howWas: 'How was it?',
    leaveReview: 'Leave a review',
    sendReview: 'Send',
    historyTitle: 'Order history',
    completed: 'Completed',
    cancelled: 'Cancelled',
    myAddresses: 'My addresses',
    payMethods: 'Payment methods',
    notifications: 'Notifications',
    language: 'Language',
    support: 'Support',
    referral: 'Invite a friend',
    logout: 'Log out',
    feedTitle: 'New jobs',
    feedSub: 'Reply to matching ones',
    nearYou: 'near you',
    sendOffer: 'Send offer',
    yourOffer: 'Your offer',
    eta: 'ETA',
    activeOrder: 'Active job',
    startJob: 'Start',
    finishJob: 'Finish',
    earnTitle: 'Earnings',
    today: 'Today',
    week: 'Week',
    month: 'Month',
    payouts: 'Payouts',
    withdraw: 'Withdraw',
    masterStats: 'Stats',
    completeRate: 'Completed',
    avgRating: 'Rating',
    responseTime: 'Response',
    onbWelcome: 'Welcome to UzUsta',
    onbWelcomeSub: 'A pro for any task — in 2 minutes',
    onbStep1: 'Describe your task',
    onbStep1Sub: 'Voice, text or photo',
    onbStep2: 'Get matched',
    onbStep2Sub: 'Suitable pros in 2 minutes',
    onbStep3: 'Pay securely',
    onbStep3Sub: 'Funds released after the job',
    getStarted: 'Get started',
    skip: 'Skip',
    onbMasterWelcome: 'Earn with UzUsta',
    onbMasterSub: 'The #1 platform for pros in Uzbekistan',
    onbMasterStep1: 'Fill your profile',
    onbMasterStep1Sub: 'Experience, skills, portfolio',
    onbMasterStep2: 'Accept jobs',
    onbMasterStep2Sub: 'Only matching tasks near you',
    onbMasterStep3: 'Get paid',
    onbMasterStep3Sub: 'Weekly to your card or Click',
  },
};

// ─── Logo ──────────────────────────────────────────────────────────────
function UzLogo({ size = 22, color = UZ.ink }) {
  return (
    <span style={{
      fontFamily: UZ.serif, fontSize: size, fontWeight: 700,
      letterSpacing: '-0.04em', color, lineHeight: 1, display: 'inline-flex', alignItems: 'baseline',
    }}>
      Uz<span style={{ fontWeight: 300, color: UZ.accent }}>Usta</span>
    </span>
  );
}

// ─── Tiny SVG icon set (stroke-based, monoline) ────────────────────────
const ic = {
  search: (s = 18, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.6"/>
      <path d="M16 16l4 4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  mic: (s = 18, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={c} strokeWidth="1.6"/>
      <path d="M5 11a7 7 0 0014 0M12 18v3" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  bell: (s = 18, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 004 0" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pin: (s = 16, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke={c} strokeWidth="1.6"/>
      <circle cx="12" cy="9" r="2.5" stroke={c} strokeWidth="1.6"/>
    </svg>
  ),
  star: (s = 14, c = UZ.gold, fill = true) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? c : 'none'} stroke={c} strokeWidth="1.4">
      <path d="M12 3l2.5 6 6.5.6-5 4.4 1.6 6.5L12 17l-5.6 3.5L8 14 3 9.6 9.5 9 12 3z" strokeLinejoin="round"/>
    </svg>
  ),
  chevron: (s = 16, c = UZ.ink3, dir = 'right') => {
    const r = { right: 0, down: 90, left: 180, up: 270 }[dir];
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${r}deg)` }}>
        <path d="M9 6l6 6-6 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  },
  plus: (s = 18, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  camera: (s = 22, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="3" stroke={c} strokeWidth="1.6"/>
      <circle cx="12" cy="13" r="3.5" stroke={c} strokeWidth="1.6"/>
      <path d="M8 6l1.5-2h5L16 6" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  shield: (s = 18, c = UZ.emerald) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (s = 16, c = UZ.ink3) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6"/>
      <path d="M12 7v5l3 2" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  phone: (s = 18, c = '#fff') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  send: (s = 20, c = '#fff') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M3 11.5L21 3l-4 18-4-8-10-1.5z"/>
    </svg>
  ),
  home: (s = 22, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  list: (s = 22, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h10" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  chat: (s = 22, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 5h16v11H8l-4 4V5z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  user: (s = 22, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.6"/>
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  wallet: (s = 22, c = UZ.ink) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke={c} strokeWidth="1.6"/>
      <path d="M16 13h2" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M3 9h18" stroke={c} strokeWidth="1.6"/>
    </svg>
  ),
  bolt: (s = 16, c = UZ.accent) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
    </svg>
  ),
  sparkle: (s = 16, c = UZ.accent) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2zM18 14l.8 2.4L21 17l-2.2.6L18 20l-.8-2.4L15 17l2.2-.6L18 14z"/>
    </svg>
  ),
};

// ─── Avatar (initials, brand-colored) ──────────────────────────────────
function Avatar({ name = 'AB', size = 36, hue = 0, src = null }) {
  const colors = [
    [UZ.accent, '#fff'],
    [UZ.emerald, '#fff'],
    [UZ.sky, '#fff'],
    [UZ.gold, UZ.ink],
    [UZ.pink, UZ.ink],
    [UZ.accent2, UZ.ink],
  ];
  const [bg, fg] = colors[hue % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: src ? `url(${src}) center/cover` : bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: UZ.sans, fontWeight: 600, fontSize: size * 0.38,
      flexShrink: 0,
    }}>
      {!src && name.split(' ').map(s => s[0]).join('').slice(0, 2)}
    </div>
  );
}

// ─── Status dot ────────────────────────────────────────────────────────
function Dot({ color = UZ.emerald, size = 8, glow = false }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: size, background: color,
      display: 'inline-block', flexShrink: 0,
      boxShadow: glow ? `0 0 0 3px ${color}33` : 'none',
    }} />
  );
}

// ─── Pill / chip ───────────────────────────────────────────────────────
function Chip({ children, bg = UZ.bg, color = UZ.ink2, icon = null }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 999, background: bg, color,
      fontSize: 12, fontFamily: UZ.sans, fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>{icon}{children}</span>
  );
}

// ─── Primary CTA ───────────────────────────────────────────────────────
function CTA({ children, color = UZ.ink, fg = '#fff', onClick, full = true, sub = null }) {
  return (
    <button onClick={onClick} style={{
      width: full ? '100%' : 'auto', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: sub ? '12px 22px' : '16px 22px',
      background: color, color: fg, borderRadius: 16,
      fontSize: 16, fontFamily: UZ.sans, fontWeight: 600,
      letterSpacing: '-0.01em', border: 'none', cursor: 'pointer',
      transition: 'transform 0.15s ease, opacity 0.15s ease',
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}>
      <span>{children}</span>
      {sub && <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>{sub}</span>}
    </button>
  );
}

// ─── Section / list card ───────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: UZ.card, borderRadius: 20,
      boxShadow: '0 1px 0 rgba(14,26,24,0.04), 0 8px 24px -16px rgba(14,26,24,0.08)',
      border: `1px solid ${UZ.line}`,
      ...style,
    }}>{children}</div>
  );
}

// ─── Section heading inside the screen ─────────────────────────────────
function SecHead({ title, action = null, style = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 20px', marginBottom: 12, ...style,
    }}>
      <div style={{ fontFamily: UZ.serif, fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: UZ.ink }}>
        {title}
      </div>
      {action && <div style={{ fontSize: 13, color: UZ.ink3 }}>{action}</div>}
    </div>
  );
}

// ─── App-level top bar (greeting / address) ────────────────────────────
function AppTop({ left, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px 8px',
    }}>
      {left}{right}
    </div>
  );
}

// ─── Bottom tab bar ────────────────────────────────────────────────────
function TabBar({ tabs, active = 0, dark = false }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 30, paddingTop: 10,
      background: dark ? 'rgba(14,26,24,0.85)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : UZ.line}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {tabs.map((t, i) => {
          const isActive = i === active;
          const c = isActive ? UZ.accent : (dark ? 'rgba(255,255,255,0.5)' : UZ.inkMute);
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 12px',
            }}>
              {t.icon(22, c)}
              <span style={{ fontSize: 10, color: c, fontWeight: 500, fontFamily: UZ.sans }}>
                {t.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phone "page" wrapper that handles the safe areas ──────────────────
function Page({ children, bg = UZ.bg, hasTabBar = false, hasStatusPad = true, scroll = true }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: bg,
      paddingTop: hasStatusPad ? 54 : 0, paddingBottom: hasTabBar ? 84 : 34,
      overflowY: scroll ? 'auto' : 'hidden', overflowX: 'hidden',
    }}>
      {children}
    </div>
  );
}

// ─── Frame wrapper with title strip ────────────────────────────────────
function PhoneFrame({ children, title, subtitle, dark = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: UZ.mono, fontSize: 11, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: UZ.inkMute, marginBottom: 4,
        }}>{subtitle}</div>
        <div style={{
          fontFamily: UZ.serif, fontSize: 22, fontWeight: 700,
          letterSpacing: '-0.03em', color: UZ.ink,
        }}>{title}</div>
      </div>
      <IOSDevice dark={dark}>{children}</IOSDevice>
    </div>
  );
}

// ─── Order card (used in client orders + master feed) ──────────────────
function OrderRow({ icon, iconBg, title, sub, meta, right, onClick, accent = false }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', cursor: 'pointer',
      borderRadius: 16,
      background: accent ? UZ.emeraldSoft : 'transparent',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, background: iconBg || UZ.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: UZ.ink, letterSpacing: '-0.01em' }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: UZ.ink3, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sub}
        </div>
        {meta && <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{meta}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── Map placeholder (stylized, no real map) ───────────────────────────
function MapPlaceholder({ height = 280, marker = true }) {
  return (
    <div style={{
      position: 'relative', height, overflow: 'hidden',
      background: `linear-gradient(135deg, #e7ede4 0%, #dde6da 100%)`,
    }}>
      {/* roads */}
      <svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(14,26,24,0.04)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="400" height="280" fill="url(#grid)"/>
        {/* major roads */}
        <path d="M-20 100 L420 80" stroke="#fff" strokeWidth="14" strokeLinecap="round"/>
        <path d="M-20 100 L420 80" stroke="#e8eee5" strokeWidth="10"/>
        <path d="M120 -20 L150 300" stroke="#fff" strokeWidth="12"/>
        <path d="M120 -20 L150 300" stroke="#e8eee5" strokeWidth="8"/>
        <path d="M-20 200 L420 220" stroke="#fff" strokeWidth="10"/>
        <path d="M-20 200 L420 220" stroke="#e8eee5" strokeWidth="6"/>
        {/* parks */}
        <rect x="220" y="120" width="100" height="60" rx="14" fill="#cfe1c8"/>
        <rect x="20" y="220" width="60" height="50" rx="10" fill="#cfe1c8"/>
        {/* buildings */}
        <rect x="40" y="120" width="40" height="50" rx="3" fill="#e2e6dd"/>
        <rect x="180" y="40" width="30" height="35" rx="3" fill="#e2e6dd"/>
        <rect x="340" y="140" width="40" height="40" rx="3" fill="#e2e6dd"/>
      </svg>
      {marker && (
        <>
          {/* route dashes */}
          <svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice"
            style={{ position: 'absolute', inset: 0 }}>
            <path d="M80 240 Q 140 180 200 160 T 300 80" stroke={UZ.accent} strokeWidth="3"
              fill="none" strokeDasharray="2 6" strokeLinecap="round"/>
          </svg>
          {/* destination */}
          <div style={{
            position: 'absolute', left: '74%', top: '28%',
            transform: 'translate(-50%, -100%)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50% 50% 50% 0',
              background: UZ.ink, transform: 'rotate(-45deg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            }}>
              <div style={{ width: 12, height: 12, borderRadius: 12, background: '#fff', transform: 'rotate(45deg)' }} />
            </div>
          </div>
          {/* moving master */}
          <div style={{
            position: 'absolute', left: '20%', top: '85%',
            transform: 'translate(-50%, -50%)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 36,
              background: UZ.accent, border: '3px solid #fff',
              boxShadow: '0 4px 14px rgba(255,107,53,0.4), 0 0 0 8px rgba(255,107,53,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11h1a1 1 0 011 1v5h-2v-2H5v2H3v-5a1 1 0 011-1h1zm1.8 0h10.4l-1-3H7.8l-1 3zM7 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm10 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Expose to window so other Babel scripts can use them
Object.assign(window, {
  UZ, APP_I18N, UzLogo, ic, Avatar, Dot, Chip, CTA, Card, SecHead, AppTop,
  TabBar, Page, PhoneFrame, OrderRow, MapPlaceholder,
});
