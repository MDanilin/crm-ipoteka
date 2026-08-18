// Master-side screens for UzUsta app

// ─── Master Onboarding ────────────────────────────────────────────────
function MasterOnboarding({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <div style={{ position: 'absolute', inset: 0, background: UZ.ink, color: '#fff',
      display: 'flex', flexDirection: 'column', padding: '60px 24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <UzLogo size={20} color="#fff"/>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{t.skip}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Big earnings card */}
        <div style={{
          width: 280, padding: '24px 22px',
          background: `linear-gradient(135deg, ${UZ.accent2} 0%, ${UZ.accent} 100%)`,
          borderRadius: 28, color: '#fff',
          boxShadow: '0 30px 80px -20px rgba(255,107,53,0.6)',
          transform: 'rotate(-3deg)',
        }}>
          <div style={{ fontSize: 11, fontFamily: UZ.mono, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8 }}>
            {lang === 'ru' ? 'Этот месяц' : 'This month'}
          </div>
          <div style={{ fontFamily: UZ.serif, fontSize: 44, fontWeight: 700, marginTop: 6, letterSpacing: '-0.02em' }}>
            12 480 000
          </div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{lang === 'ru' ? 'сум · 47 заказов' : 'UZS · 47 jobs'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 999, width: 'fit-content' }}>
            <span style={{ fontSize: 11 }}>↑ 24%</span>
            <span style={{ fontSize: 11, opacity: 0.85 }}>{lang === 'ru' ? 'к прошлому' : 'vs last'}</span>
          </div>
        </div>
        {/* Floating chips */}
        <div style={{ position: 'absolute', top: '15%', right: 10, padding: '8px 14px', borderRadius: 999, background: '#fff', color: UZ.ink, fontSize: 13, fontWeight: 600, transform: 'rotate(6deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          ★ 4.9
        </div>
        <div style={{ position: 'absolute', bottom: '15%', left: 10, padding: '8px 14px', borderRadius: 999, background: UZ.gold, color: UZ.ink, fontSize: 13, fontWeight: 600, transform: 'rotate(-8deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          {lang === 'ru' ? '+2 заявки' : '+2 jobs'}
        </div>
      </div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: UZ.serif, fontSize: 36, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: 12 }}>
          {t.onbMasterWelcome.split(' ').slice(0, -1).join(' ')}{' '}
          <em style={{ fontWeight: 300, color: UZ.accent2 }}>{t.onbMasterWelcome.split(' ').slice(-1)}</em>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{t.onbMasterSub}</p>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
        <span style={{ width: 24, height: 6, borderRadius: 6, background: UZ.accent }}/>
        <span style={{ width: 6, height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.2)' }}/>
        <span style={{ width: 6, height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.2)' }}/>
      </div>
      <CTA color={UZ.accent}>{t.getStarted}</CTA>
    </div>
  );
}

// ─── Master Feed (incoming jobs) ──────────────────────────────────────
function MasterFeed({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  const jobs = [
    { cat: t.catPlumb, sub: lang === 'ru' ? 'Подтекает кран на кухне, нужна замена прокладки.' : 'Kitchen faucet leaking, gasket replacement needed.', dist: '1.2', price: '180 — 250', when: lang === 'ru' ? 'Сейчас' : 'Now', urgent: true, icon: '🔧', bg: UZ.skySoft, photos: 2 },
    { cat: t.catPlumb, sub: lang === 'ru' ? 'Установка нового бойлера 80 л.' : 'Install new 80L boiler.', dist: '3.4', price: '500 — 700', when: lang === 'ru' ? 'Завтра, 10:00' : 'Tomorrow, 10:00', icon: '🚿', bg: UZ.skySoft, photos: 4 },
    { cat: t.catPlumb, sub: lang === 'ru' ? 'Замена смесителя в ванной + проверка.' : 'Bathroom mixer replacement + check.', dist: '0.8', price: '150 — 200', when: lang === 'ru' ? 'Через 2 ч' : 'In 2 h', icon: '🛁', bg: UZ.skySoft, photos: 1 },
  ];
  return (
    <Page hasTabBar>
      {/* Top bar with online toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px' }}>
        <div>
          <div style={{ fontSize: 13, color: UZ.ink3 }}>{lang === 'ru' ? 'Доброе утро,' : 'Good morning,'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: UZ.ink, marginTop: 2 }}>Алишер К.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 999, background: UZ.emeraldSoft, border: `1px solid ${UZ.emerald}33` }}>
          <div style={{ width: 24, height: 24, borderRadius: 24, background: UZ.emerald, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dot color="#fff" size={6} glow/>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: UZ.emerald }}>{lang === 'ru' ? 'Онлайн' : 'Online'}</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '8px 20px 18px' }}>
        <h1 style={{ fontFamily: UZ.serif, fontSize: 30, fontWeight: 700, letterSpacing: '-0.035em', color: UZ.ink, lineHeight: 1.05 }}>
          {t.feedTitle.split(' ').slice(0, -1).join(' ')}{' '}
          <em style={{ fontWeight: 300, color: UZ.accent }}>{t.feedTitle.split(' ').slice(-1)}</em>
        </h1>
        <div style={{ fontSize: 14, color: UZ.ink3, marginTop: 6 }}>{t.feedSub}</div>
      </div>

      {/* Quick filters */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {[
          { l: lang === 'ru' ? 'Все · 12' : 'All · 12', sel: true },
          { l: lang === 'ru' ? '< 2 км' : '< 2 km', sel: false },
          { l: t.urgent, sel: false },
          { l: lang === 'ru' ? 'Сегодня' : 'Today', sel: false },
        ].map((f, i) => (
          <div key={i} style={{
            padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap',
            background: f.sel ? UZ.ink : UZ.card, color: f.sel ? '#fff' : UZ.ink2,
            border: `1px solid ${f.sel ? UZ.ink : UZ.line}`, fontSize: 13, fontWeight: 500,
          }}>{f.l}</div>
        ))}
      </div>

      {/* Job cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {jobs.map((j, i) => (
          <Card key={i} style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: j.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{j.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: UZ.ink }}>{j.cat}</span>
                  {j.urgent && <Chip bg={UZ.accent} color="#fff" icon={ic.bolt(10, '#fff')}>{t.urgent}</Chip>}
                </div>
                <div style={{ fontSize: 13, color: UZ.ink2, lineHeight: 1.4 }}>{j.sub}</div>
              </div>
            </div>
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: `1px solid ${UZ.line}`, borderBottom: `1px solid ${UZ.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: UZ.ink3 }}>
                {ic.pin(12, UZ.ink3)}<span>{j.dist} {lang === 'ru' ? 'км' : 'km'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: UZ.ink3 }}>
                {ic.clock(12, UZ.ink3)}<span>{j.when}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: UZ.ink3 }}>
                <span>📷 {j.photos}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: UZ.ink3, fontFamily: UZ.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.estPrice}</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: UZ.serif, color: UZ.ink, marginTop: 2 }}>
                  {j.price} 000 <span style={{ fontSize: 12, color: UZ.ink3, fontFamily: UZ.sans, fontWeight: 400 }}>{lang === 'ru' ? 'сум' : 'UZS'}</span>
                </div>
              </div>
              <button style={{ background: UZ.ink, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{t.sendOffer}</button>
            </div>
          </Card>
        ))}
      </div>

      <TabBar active={0} tabs={[
        { icon: ic.list, label: t.tabFeed },
        { icon: ic.bolt, label: t.tabActive },
        { icon: ic.wallet, label: t.tabEarn },
        { icon: ic.user, label: t.tabProfile },
      ]}/>
    </Page>
  );
}

// ─── Master Active Job ─────────────────────────────────────────────────
function MasterActive({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <Page>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px' }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{t.activeOrder}</span>
        <Chip bg={UZ.emeraldSoft} color={UZ.emerald} icon={<Dot color={UZ.emerald} size={6} glow/>}>
          {lang === 'ru' ? 'В работе' : 'In progress'}
        </Chip>
      </div>

      {/* Client card */}
      <div style={{ padding: '12px 20px' }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name="Айгуль К." hue={2} size={48}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: UZ.ink }}>Айгуль К.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {ic.star(11, UZ.gold)}
                <span style={{ fontSize: 12, color: UZ.ink3 }}>4.8 · 27 {lang === 'ru' ? 'заказов' : 'orders'}</span>
              </div>
            </div>
            <button style={{ width: 40, height: 40, borderRadius: 12, background: UZ.emerald, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {ic.phone(18, '#fff')}
            </button>
            <button style={{ width: 40, height: 40, borderRadius: 12, background: UZ.ink, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {ic.chat(18, '#fff')}
            </button>
          </div>
        </Card>
      </div>

      {/* Address */}
      <div style={{ padding: '0 20px 12px' }}>
        <Card style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: UZ.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ic.pin(18, UZ.accent)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: UZ.ink, fontWeight: 600 }}>
              {lang === 'ru' ? 'Юнусободский, 12-12, кв. 47' : 'Yunusobod, 12-12, apt. 47'}
            </div>
            <div style={{ fontSize: 12, color: UZ.ink3, marginTop: 2 }}>1.2 {lang === 'ru' ? 'км · 8 минут' : 'km · 8 min'}</div>
          </div>
          <div style={{ padding: '8px 12px', background: UZ.accent, color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
            {lang === 'ru' ? 'GPS' : 'GPS'}
          </div>
        </Card>
      </div>

      {/* Task brief */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ fontSize: 13, color: UZ.ink3, marginBottom: 8, paddingLeft: 4 }}>{t.describeTask}</div>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 14, color: UZ.ink, lineHeight: 1.4 }}>
            {lang === 'ru'
              ? 'Подтекает кран на кухне, вода капает постоянно. Возможно, нужна прокладка.'
              : 'Kitchen faucet leaking, water drips constantly. Maybe a gasket needed.'}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[UZ.skySoft, UZ.pinkSoft].map((c, i) => (
              <div key={i} style={{ width: 60, height: 60, borderRadius: 10, background: `linear-gradient(135deg, ${c}, rgba(255,255,255,0.5))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {['🔧', '💧'][i]}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Earning */}
      <div style={{ padding: '0 20px 16px' }}>
        <Card style={{ padding: 16, background: UZ.ink, color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: UZ.mono, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6 }}>{lang === 'ru' ? 'Вы получите' : 'You earn'}</div>
              <div style={{ fontFamily: UZ.serif, fontSize: 28, fontWeight: 700, marginTop: 4, letterSpacing: '-0.01em' }}>
                184 000 <span style={{ fontSize: 14, opacity: 0.6 }}>{lang === 'ru' ? 'сум' : 'UZS'}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{lang === 'ru' ? 'Чек' : 'Total'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>200 000</div>
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>−8% UzUsta</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 20px' }}>
        <CTA color={UZ.accent}>{t.startJob}</CTA>
      </div>
    </Page>
  );
}

// ─── Master Earnings ───────────────────────────────────────────────────
function MasterEarnings({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  const days = lang === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Mo','Tu','We','Th','Fr','Sa','Su'];
  const heights = [40, 65, 80, 55, 90, 70, 30];
  return (
    <Page hasTabBar>
      <AppTop
        left={<div style={{ fontFamily: UZ.serif, fontSize: 32, fontWeight: 700, letterSpacing: '-0.035em' }}>{t.earnTitle}</div>}
        right={<div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${UZ.line}` }}>{ic.bell(18)}</div>}
      />

      {/* Period tabs */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', gap: 6 }}>
        {[t.today, t.week, t.month].map((p, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10,
            background: i === 1 ? UZ.ink : 'transparent', color: i === 1 ? '#fff' : UZ.ink3,
            fontSize: 13, fontWeight: 500,
          }}>{p}</div>
        ))}
      </div>

      {/* Hero amount */}
      <div style={{ padding: '8px 20px 0' }}>
        <Card style={{ padding: 20, background: `linear-gradient(135deg, ${UZ.accent2}, ${UZ.accent})`, color: '#fff', border: 'none' }}>
          <div style={{ fontSize: 11, fontFamily: UZ.mono, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85 }}>
            {lang === 'ru' ? 'Заработано на этой неделе' : 'Earned this week'}
          </div>
          <div style={{ fontFamily: UZ.serif, fontSize: 40, fontWeight: 700, letterSpacing: '-0.035em', marginTop: 4 }}>
            2 840 000
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(255,255,255,0.22)', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
              ↑ 18%
            </div>
            <span style={{ fontSize: 12, opacity: 0.85 }}>{lang === 'ru' ? 'к прошлой неделе' : 'vs last week'}</span>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: 10, padding: '0 4px' }}>
          {heights.map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: '100%', height: h + '%',
                background: i === 4 ? UZ.accent : UZ.lineStrong,
                borderRadius: 6,
              }}/>
              <span style={{ fontSize: 11, color: i === 4 ? UZ.ink : UZ.inkMute, fontWeight: i === 4 ? 600 : 400 }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <SecHead title={t.masterStats} style={{ marginTop: 16 }}/>
      <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { l: t.completeRate, v: '47', sub: lang === 'ru' ? 'заказов' : 'jobs', icon: '✓', bg: UZ.emeraldSoft, c: UZ.emerald },
          { l: t.avgRating, v: '4.9', sub: '★', icon: '★', bg: UZ.gold + '33', c: UZ.ink },
          { l: t.responseTime, v: '2.3', sub: lang === 'ru' ? 'мин' : 'min', icon: '⚡', bg: UZ.accent + '22', c: UZ.accent },
          { l: t.payouts, v: '8', sub: lang === 'ru' ? 'выплат' : 'payouts', icon: '💸', bg: UZ.skySoft, c: UZ.sky },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 10 }}>
              {s.icon}
            </div>
            <div style={{ fontFamily: UZ.serif, fontSize: 22, fontWeight: 700, color: UZ.ink }}>{s.v}</div>
            <div style={{ fontSize: 11, color: UZ.ink3, marginTop: 2 }}>{s.l} · {s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Withdraw */}
      <div style={{ padding: '0 20px 12px' }}>
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: UZ.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ic.wallet(20, UZ.ink2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: UZ.ink3 }}>{lang === 'ru' ? 'Доступно к выводу' : 'Available to withdraw'}</div>
            <div style={{ fontFamily: UZ.serif, fontSize: 18, fontWeight: 700, color: UZ.ink, marginTop: 2 }}>1 240 000 <span style={{ fontSize: 12, color: UZ.ink3, fontWeight: 400, fontFamily: UZ.sans }}>{lang === 'ru' ? 'сум' : 'UZS'}</span></div>
          </div>
          <button style={{ background: UZ.ink, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{t.withdraw}</button>
        </Card>
      </div>

      <TabBar active={2} tabs={[
        { icon: ic.list, label: t.tabFeed },
        { icon: ic.bolt, label: t.tabActive },
        { icon: ic.wallet, label: t.tabEarn },
        { icon: ic.user, label: t.tabProfile },
      ]}/>
    </Page>
  );
}

// ─── Master Profile ────────────────────────────────────────────────────
function MasterProfile({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <Page hasTabBar>
      <AppTop
        left={<div style={{ fontFamily: UZ.serif, fontSize: 32, fontWeight: 700, letterSpacing: '-0.035em' }}>{t.tabProfile}</div>}
        right={<div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${UZ.line}` }}>⚙</div>}
      />

      {/* Hero */}
      <div style={{ padding: '8px 20px 20px', textAlign: 'center' }}>
        <Avatar name="Алишер К." hue={0} size={88}/>
        <div style={{ fontFamily: UZ.serif, fontSize: 24, fontWeight: 700, color: UZ.ink, marginTop: 12 }}>Алишер Каримов</div>
        <div style={{ fontSize: 13, color: UZ.ink3, marginTop: 2 }}>{t.catPlumb} · 7 {lang === 'ru' ? 'лет' : 'yrs'}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <Chip bg={UZ.emeraldSoft} color={UZ.emerald} icon={ic.shield(11, UZ.emerald)}>{lang === 'ru' ? 'Верифицирован' : 'Verified'}</Chip>
          <Chip bg={UZ.gold + '33'} color={UZ.ink}>★ 4.9</Chip>
        </div>
      </div>

      {/* Specialties */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 13, color: UZ.ink3, marginBottom: 8 }}>{lang === 'ru' ? 'Специализация' : 'Specialties'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[t.catPlumb, lang === 'ru' ? 'Бойлеры' : 'Boilers', lang === 'ru' ? 'Смесители' : 'Mixers', lang === 'ru' ? 'Канализация' : 'Sewerage'].map((s, i) => (
            <Chip key={i} bg={UZ.card} color={UZ.ink2}>{s}</Chip>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: '0 20px' }}>
        <Card style={{ padding: 0 }}>
          {[
            { l: t.portfolio, c: '14 ' + (lang === 'ru' ? 'фото' : 'photos'), icon: ic.camera(18, UZ.ink2), bg: UZ.skySoft },
            { l: t.reviews, c: '312', icon: ic.star(16, UZ.gold), bg: UZ.gold + '33' },
            { l: lang === 'ru' ? 'Расписание' : 'Schedule', icon: ic.clock(16, UZ.ink2), bg: UZ.emeraldSoft },
            { l: lang === 'ru' ? 'Документы' : 'Documents', c: lang === 'ru' ? 'Подтверждены' : 'Verified', icon: ic.shield(16, UZ.emerald), bg: UZ.pinkSoft },
            { l: t.support, icon: ic.chat(18, UZ.ink2), bg: '#f0e8dc' },
          ].map((it, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${UZ.line}` : 'none',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: it.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.icon}</div>
              <span style={{ flex: 1, fontSize: 15, color: UZ.ink, fontWeight: 500 }}>{it.l}</span>
              {it.c && <span style={{ fontSize: 13, color: UZ.ink3, marginRight: 4 }}>{it.c}</span>}
              {ic.chevron(14, UZ.ink3)}
            </div>
          ))}
        </Card>
      </div>

      <TabBar active={3} tabs={[
        { icon: ic.list, label: t.tabFeed },
        { icon: ic.bolt, label: t.tabActive },
        { icon: ic.wallet, label: t.tabEarn },
        { icon: ic.user, label: t.tabProfile },
      ]}/>
    </Page>
  );
}

// ─── Master Chat (similar to client but inverted) ─────────────────────
function MasterChat({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  const msgs = [
    { from: 'them', text: lang === 'ru' ? 'Здравствуйте! Когда сможете приехать?' : 'Hi! When can you come?', t: '14:20' },
    { from: 'me', text: lang === 'ru' ? 'Здравствуйте! Я в 8 минутах от вас.' : 'Hello! I\'m 8 min away.', t: '14:24' },
    { from: 'them', text: lang === 'ru' ? 'Хорошо, домофон не работает, я открою.' : 'Ok, intercom is broken, I\'ll let you in.', t: '14:25' },
    { from: 'me', text: lang === 'ru' ? 'Понял. На фото вижу — нужна прокладка, у меня есть.' : 'Got it. From the photo — need a gasket, have one.', t: '14:25' },
  ];
  return (
    <Page hasStatusPad={false} scroll={false}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 54,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${UZ.line}`, zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 12px' }}>
          {ic.chevron(20, UZ.ink, 'left')}
          <Avatar name="Айгуль К." hue={2} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Айгуль К.</div>
            <div style={{ fontSize: 11, color: UZ.ink3 }}>{lang === 'ru' ? 'Заказ #2847' : 'Order #2847'}</div>
          </div>
          <button style={{ width: 36, height: 36, borderRadius: 12, background: UZ.emerald, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ic.phone(16, '#fff')}
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 116, bottom: 90, left: 0, right: 0, padding: '16px 16px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
            <div style={{
              padding: '10px 14px', borderRadius: 18,
              background: m.from === 'me' ? UZ.accent : UZ.card,
              color: m.from === 'me' ? '#fff' : UZ.ink,
              fontSize: 14, lineHeight: 1.35,
              borderBottomRightRadius: m.from === 'me' ? 4 : 18,
              borderBottomLeftRadius: m.from === 'me' ? 18 : 4,
              border: m.from === 'me' ? 'none' : `1px solid ${UZ.line}`,
            }}>{m.text}</div>
            <div style={{ fontSize: 10, color: UZ.inkMute, marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left', paddingInline: 6 }}>{m.t}</div>
          </div>
        ))}
        {/* Quick replies */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignSelf: 'flex-end', marginTop: 4 }}>
          {[lang === 'ru' ? '👍 Хорошо' : '👍 Ok', lang === 'ru' ? 'Уже еду' : 'On my way', lang === 'ru' ? 'Задержусь' : 'Running late'].map((q, i) => (
            <div key={i} style={{ padding: '6px 12px', background: UZ.accent + '22', color: UZ.accentDeep, borderRadius: 999, fontSize: 12, fontWeight: 500 }}>{q}</div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '10px 12px 30px', background: UZ.card,
        borderTop: `1px solid ${UZ.line}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic.plus(20)}</div>
        <div style={{ flex: 1, padding: '10px 14px', borderRadius: 22, background: UZ.bg, fontSize: 14, color: UZ.inkMute }}>{t.typeMsg}</div>
        <div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic.send(18, '#fff')}</div>
      </div>
    </Page>
  );
}

Object.assign(window, {
  MasterOnboarding, MasterFeed, MasterActive, MasterEarnings, MasterProfile, MasterChat,
});
