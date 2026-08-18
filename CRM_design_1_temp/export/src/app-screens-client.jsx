// Client-side screens for UzUsta app
// Reads UZ, APP_I18N, ic, Avatar, Chip, CTA, Card, SecHead, AppTop, TabBar, Page, OrderRow, MapPlaceholder, UzLogo from window

// ─── Onboarding ────────────────────────────────────────────────────────
function ClientOnboarding({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <div style={{ position: 'absolute', inset: 0, background: UZ.bg,
      display: 'flex', flexDirection: 'column', padding: '60px 24px 40px' }}>
      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: UZ.ink3 }}>{t.skip}</span>
      </div>
      {/* Hero illustration */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${UZ.accent2} 0%, ${UZ.accent} 60%, ${UZ.accentDeep} 100%)`,
          position: 'relative',
          boxShadow: '0 30px 80px -20px rgba(255,107,53,0.5)',
        }}>
          {/* tools floating around */}
          <div style={{
            position: 'absolute', top: -20, left: 20, width: 80, height: 80,
            background: UZ.card, borderRadius: 22, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 30px -8px rgba(0,0,0,0.15)',
            transform: 'rotate(-8deg)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill={UZ.ink}>
              <path d="M14.7 6.3a4 4 0 00-5.4 5.4l-7 7 2 2 7-7a4 4 0 005.4-5.4l-2.6 2.6L13 9l1.7-2.7z"/>
            </svg>
          </div>
          <div style={{
            position: 'absolute', bottom: 10, right: -10, width: 70, height: 70,
            background: UZ.ink, borderRadius: 20, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 30px -8px rgba(0,0,0,0.25)',
            transform: 'rotate(12deg)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill={UZ.gold}>
              <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>
            </svg>
          </div>
          <div style={{
            position: 'absolute', top: 30, right: -30, width: 56, height: 56,
            background: UZ.gold, borderRadius: 18, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(15deg)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill={UZ.ink}>
              <path d="M5 21l7-3 7 3v-3l-7-3-7 3v3zm7-12a3 3 0 100-6 3 3 0 000 6z"/>
            </svg>
          </div>
        </div>
      </div>
      {/* Text */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: UZ.serif, fontSize: 36, fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.05, color: UZ.ink,
          marginBottom: 12,
        }}>
          {t.onbWelcome.split(' ').slice(0, -1).join(' ')}{' '}
          <em style={{ fontWeight: 300, color: UZ.accent }}>
            {t.onbWelcome.split(' ').slice(-1)}
          </em>
        </h1>
        <p style={{ fontSize: 16, color: UZ.ink3, lineHeight: 1.4 }}>
          {t.onbWelcomeSub}
        </p>
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
        <span style={{ width: 24, height: 6, borderRadius: 6, background: UZ.ink }} />
        <span style={{ width: 6, height: 6, borderRadius: 6, background: UZ.lineStrong }} />
        <span style={{ width: 6, height: 6, borderRadius: 6, background: UZ.lineStrong }} />
      </div>
      <CTA color={UZ.ink}>{t.getStarted}</CTA>
    </div>
  );
}

// ─── Home ──────────────────────────────────────────────────────────────
function ClientHome({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  const cats = [
    { k: 'catPlumb', bg: UZ.skySoft, icon: '🔧', accent: UZ.sky },
    { k: 'catElec', bg: '#fef3d7', icon: '⚡', accent: '#d4a017' },
    { k: 'catClean', bg: UZ.emeraldSoft, icon: '🧽', accent: UZ.emerald },
    { k: 'catAC', bg: '#e3eef5', icon: '❄️', accent: UZ.sky },
    { k: 'catAppl', bg: UZ.pinkSoft, icon: '🔌', accent: UZ.pink },
    { k: 'catFurn', bg: '#f0e8dc', icon: '🪑', accent: '#a0825a' },
  ];
  return (
    <Page hasTabBar>
      <AppTop
        left={
          <div>
            <div style={{ fontSize: 13, color: UZ.ink3 }}>{t.helloMorning}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: UZ.ink, fontWeight: 600, marginTop: 2 }}>
              {ic.pin(14, UZ.accent)} Юнусобод 12-12
              {ic.chevron(14, UZ.ink3, 'down')}
            </div>
          </div>
        }
        right={
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${UZ.line}`, position: 'relative' }}>
              {ic.bell(18)}
              <span style={{ position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 6, background: UZ.accent }}/>
            </div>
            <Avatar name="АК" hue={2} size={38} />
          </div>
        }
      />

      {/* Headline */}
      <div style={{ padding: '8px 20px 18px' }}>
        <h1 style={{
          fontFamily: UZ.serif, fontSize: 32, fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.05, color: UZ.ink,
        }}>
          {t.whatToday.split(' ').slice(0, -1).join(' ')}{' '}
          <em style={{ fontWeight: 300, color: UZ.accent }}>
            {t.whatToday.split(' ').slice(-1)}
          </em>
        </h1>
      </div>

      {/* Search bar */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: UZ.card, borderRadius: 16,
          border: `1px solid ${UZ.line}`,
        }}>
          {ic.search(18, UZ.ink3)}
          <span style={{ flex: 1, fontSize: 15, color: UZ.inkMute }}>
            {t.searchPh}
          </span>
          <div style={{
            width: 32, height: 32, borderRadius: 32, background: UZ.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{ic.mic(16, '#fff')}</div>
        </div>
      </div>

      {/* Quick actions: Urgent + AI */}
      <div style={{ padding: '0 20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{
          padding: 14, borderRadius: 18, background: UZ.ink, color: '#fff',
          display: 'flex', flexDirection: 'column', gap: 8,
          minHeight: 112, justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {ic.bolt(14, UZ.gold)}
            <span style={{ fontSize: 11, fontFamily: UZ.mono, letterSpacing: '0.1em', textTransform: 'uppercase', color: UZ.gold }}>30 МИН</span>
          </div>
          <div>
            <div style={{ fontFamily: UZ.serif, fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>{t.urgent}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{t.urgentSub}</div>
          </div>
        </div>
        <div style={{
          padding: 14, borderRadius: 18,
          background: `linear-gradient(135deg, ${UZ.accent2} 0%, ${UZ.accent} 100%)`,
          color: '#fff',
          minHeight: 112,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {ic.sparkle(14, '#fff')}
            <span style={{ fontSize: 11, fontFamily: UZ.mono, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI</span>
          </div>
          <div>
            <div style={{ fontFamily: UZ.serif, fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>{t.aiHelp}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{t.aiHelpSub}</div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <SecHead title={t.popular} action={t.seeAll}/>
      <div style={{
        padding: '0 20px 24px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      }}>
        {cats.map((c, i) => (
          <div key={i} style={{
            background: UZ.card, borderRadius: 18, padding: '16px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            border: `1px solid ${UZ.line}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: c.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>{c.icon}</div>
            <span style={{ fontSize: 12, color: UZ.ink, fontWeight: 500, textAlign: 'center' }}>
              {t[c.k]}
            </span>
          </div>
        ))}
      </div>

      {/* Pros near you */}
      <SecHead title={t.nearbyPros} action={t.seeAll}/>
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 16px', overflowX: 'auto' }}>
        {[
          { name: 'Алишер К.', cat: t.catPlumb, rate: '4.9', jobs: 312, hue: 0 },
          { name: 'Дилшод М.', cat: t.catElec, rate: '4.8', jobs: 187, hue: 1 },
          { name: 'Зухра А.', cat: t.catClean, rate: '5.0', jobs: 421, hue: 4 },
        ].map((p, i) => (
          <div key={i} style={{
            background: UZ.card, borderRadius: 18, padding: 14,
            minWidth: 160, border: `1px solid ${UZ.line}`,
          }}>
            <Avatar name={p.name} hue={p.hue} size={44}/>
            <div style={{ fontSize: 14, fontWeight: 600, color: UZ.ink, marginTop: 10 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: UZ.ink3, marginTop: 2 }}>{p.cat}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              {ic.star(12, UZ.gold)}
              <span style={{ fontSize: 12, fontWeight: 600, color: UZ.ink }}>{p.rate}</span>
              <span style={{ fontSize: 11, color: UZ.inkMute }}>· {p.jobs} {t.jobs}</span>
            </div>
          </div>
        ))}
      </div>

      <TabBar active={0} tabs={[
        { icon: ic.home, label: t.tabHome },
        { icon: ic.list, label: t.tabOrders },
        { icon: ic.chat, label: t.tabChat },
        { icon: ic.user, label: t.tabProfile },
      ]}/>
    </Page>
  );
}

// ─── Create Order ──────────────────────────────────────────────────────
function ClientCreateOrder({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <Page>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 8px',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 38, background: UZ.card,
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${UZ.line}`,
        }}>{ic.chevron(16, UZ.ink, 'left')}</div>
        <span style={{ fontSize: 15, fontWeight: 600, color: UZ.ink }}>{t.newOrder}</span>
        <span style={{ width: 38, height: 38 }} />
      </div>

      {/* Category */}
      <div style={{ padding: '12px 20px' }}>
        <Card style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: UZ.skySoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🔧</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: UZ.ink3, fontFamily: UZ.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {lang === 'ru' ? 'Категория' : 'Category'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: UZ.ink, marginTop: 2 }}>{t.catPlumb}</div>
          </div>
          {ic.chevron(16, UZ.ink3)}
        </Card>
      </div>

      {/* Description */}
      <div style={{ padding: '8px 20px' }}>
        <div style={{ fontSize: 13, color: UZ.ink3, marginBottom: 8, paddingLeft: 4 }}>{t.describeTask}</div>
        <Card style={{ padding: 16, minHeight: 100 }}>
          <div style={{ fontSize: 15, color: UZ.ink, lineHeight: 1.4 }}>
            {lang === 'ru'
              ? 'Подтекает кран на кухне, вода капает постоянно. Нужно посмотреть и починить — возможно, заменить прокладку.'
              : 'Kitchen faucet is leaking, water dripping constantly. Need someone to look and fix — maybe replace the gasket.'}
          </div>
        </Card>
      </div>

      {/* Photos */}
      <div style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 14,
            background: `linear-gradient(135deg, ${UZ.skySoft}, ${UZ.emeraldSoft})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <svg width="50" height="50" viewBox="0 0 50 50" fill={UZ.sky} opacity="0.3">
              <path d="M10 30c0-3 4-6 8-6s4-4 8-4 6 6 12 6v10H10v-6z"/>
            </svg>
          </div>
          <div style={{
            width: 76, height: 76, borderRadius: 14, background: UZ.pinkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="40" height="40" viewBox="0 0 50 50" fill={UZ.pink} opacity="0.5">
              <circle cx="20" cy="20" r="6"/><path d="M5 40l12-12 8 8 6-6 14 14H5z"/>
            </svg>
          </div>
          <div style={{
            width: 76, height: 76, borderRadius: 14, border: `1.5px dashed ${UZ.lineStrong}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 4,
          }}>
            {ic.camera(20, UZ.ink3)}
            <span style={{ fontSize: 10, color: UZ.ink3 }}>{t.addPhotos}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div style={{ padding: '12px 20px' }}>
        <Card style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, background: UZ.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{ic.pin(18, UZ.accent)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: UZ.ink3, fontFamily: UZ.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.selectAddr}</div>
            <div style={{ fontSize: 14, color: UZ.ink, marginTop: 2, fontWeight: 500 }}>
              {lang === 'ru' ? 'Юнусободский, 12-12, кв. 47' : 'Yunusobod, 12-12, apt. 47'}
            </div>
          </div>
          {ic.chevron(16, UZ.ink3)}
        </Card>
      </div>

      {/* Time */}
      <div style={{ padding: '12px 20px 16px' }}>
        <div style={{ fontSize: 13, color: UZ.ink3, marginBottom: 8, paddingLeft: 4 }}>{t.selectTime}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { label: t.selectTimeNow, active: true, sub: lang === 'ru' ? '~30 мин' : '~30 min' },
            { label: t.selectTime2h, active: false },
            { label: t.selectTimeTmr, active: false, sub: lang === 'ru' ? '10:00' : '10:00' },
            { label: t.selectTimePick, active: false },
          ].map((o, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: 14,
              background: o.active ? UZ.ink : UZ.card,
              color: o.active ? '#fff' : UZ.ink,
              border: `1px solid ${o.active ? UZ.ink : UZ.line}`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{o.label}</div>
              {o.sub && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{o.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Estimate + CTA pinned */}
      <div style={{ padding: '0 20px 16px' }}>
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: UZ.emeraldSoft, border: 'none' }}>
          <div>
            <div style={{ fontSize: 12, color: UZ.ink3, marginBottom: 2 }}>{t.estPrice}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: UZ.ink, fontFamily: UZ.serif, letterSpacing: '-0.01em' }}>
              180 000 — 250 000 {lang === 'ru' ? 'сум' : 'UZS'}
            </div>
          </div>
          {ic.shield(22, UZ.emerald)}
        </Card>
      </div>
      <div style={{ padding: '0 20px' }}>
        <CTA color={UZ.accent} sub={t.publishingTo}>{t.publish}</CTA>
      </div>
    </Page>
  );
}

// ─── Matches / offers ──────────────────────────────────────────────────
function ClientMatches({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  const masters = [
    { name: 'Алишер К.', rate: '4.9', jobs: 312, eta: 18, price: 180, hue: 0, top: true },
    { name: 'Дилшод М.', rate: '4.8', jobs: 187, eta: 25, price: 200, hue: 1 },
    { name: 'Хасан Р.', rate: '4.7', jobs: 96, eta: 32, price: 165, hue: 3 },
  ];
  return (
    <Page>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px' }}>
        <div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${UZ.line}` }}>
          {ic.chevron(16, UZ.ink, 'left')}
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: UZ.ink }}>{t.matches}</span>
        <span style={{ width: 38, height: 38 }} />
      </div>
      <div style={{ padding: '8px 20px 16px' }}>
        <h1 style={{ fontFamily: UZ.serif, fontSize: 28, fontWeight: 700, letterSpacing: '-0.035em', color: UZ.ink, lineHeight: 1.1 }}>
          3 <em style={{ fontWeight: 300, color: UZ.accent }}>{t.matchesGot}</em>
        </h1>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {masters.map((m, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Avatar name={m.name} hue={m.hue} size={48}/>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: UZ.ink }}>{m.name}</span>
                  {m.top && <Chip bg={UZ.gold} color={UZ.ink}>★ {t.inTopRated}</Chip>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  {ic.star(12, UZ.gold)}
                  <span style={{ fontSize: 12, fontWeight: 600, color: UZ.ink }}>{m.rate}</span>
                  <span style={{ fontSize: 12, color: UZ.inkMute }}>· {m.jobs} {t.jobs}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: `1px solid ${UZ.line}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: UZ.ink3, fontFamily: UZ.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.arriveIn}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: UZ.ink }}>{m.eta} {lang === 'ru' ? 'мин' : 'min'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: UZ.ink3, fontFamily: UZ.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.estPrice}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: UZ.ink, fontFamily: UZ.serif }}>{m.price} 000</span>
              </div>
              <button style={{
                background: UZ.accent, color: '#fff', border: 'none',
                padding: '10px 18px', borderRadius: 12, fontSize: 13,
                fontWeight: 600, fontFamily: UZ.sans, cursor: 'pointer',
              }}>{t.chooseMaster}</button>
            </div>
          </Card>
        ))}
      </div>

      {/* Still searching shimmer */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{
          padding: 14, borderRadius: 16, border: `1px dashed ${UZ.lineStrong}`,
          display: 'flex', alignItems: 'center', gap: 10, color: UZ.ink3,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 8, background: UZ.accent, boxShadow: `0 0 0 4px ${UZ.accent}33` }}/>
          <span style={{ fontSize: 13 }}>{t.waiting}</span>
        </div>
      </div>
    </Page>
  );
}

// ─── Master Profile (client view) ──────────────────────────────────────
function ClientMasterProfile({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <Page>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px' }}>
        <div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${UZ.line}` }}>
          {ic.chevron(16, UZ.ink, 'left')}
        </div>
        <span style={{ width: 38, height: 38 }}/>
      </div>

      {/* Hero */}
      <div style={{ padding: '8px 20px 20px', textAlign: 'center' }}>
        <Avatar name="Алишер К." hue={0} size={88}/>
        <div style={{ fontFamily: UZ.serif, fontSize: 26, fontWeight: 700, color: UZ.ink, marginTop: 12, letterSpacing: '-0.01em' }}>
          Алишер Каримов
        </div>
        <div style={{ fontSize: 14, color: UZ.ink3, marginTop: 4 }}>{t.catPlumb} · 7 {lang === 'ru' ? 'лет опыта' : 'years exp.'}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <Chip bg={UZ.emeraldSoft} color={UZ.emerald} icon={ic.shield(12, UZ.emerald)}>
            {lang === 'ru' ? 'Верифицирован' : 'Verified'}
          </Chip>
          <Chip bg={UZ.gold + '33'} color={UZ.ink}>★ {t.inTopRated}</Chip>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '0 20px 20px' }}>
        <Card style={{ padding: 16, display: 'flex', justifyContent: 'space-between' }}>
          {[
            { v: '4.9', l: t.rating, icon: ic.star(14, UZ.gold) },
            { v: '312', l: t.jobs },
            { v: '98%', l: t.completeRate },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i ? `1px solid ${UZ.line}` : 'none' }}>
              <div style={{ fontFamily: UZ.serif, fontSize: 22, fontWeight: 700, color: UZ.ink, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                {s.icon}{s.v}
              </div>
              <div style={{ fontSize: 11, color: UZ.ink3, marginTop: 4, fontFamily: UZ.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* About */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 13, color: UZ.ink3, marginBottom: 8 }}>{t.aboutMe}</div>
        <div style={{ fontSize: 14, color: UZ.ink2, lineHeight: 1.5 }}>
          {lang === 'ru'
            ? 'Сантехник с 7-летним опытом. Установка бойлеров, замена труб, ремонт смесителей. Гарантия на все работы — 6 месяцев.'
            : 'Plumber with 7 years of experience. Boiler installation, pipe replacement, faucet repair. 6-month warranty on all work.'}
        </div>
      </div>

      {/* Portfolio */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 13, color: UZ.ink3, marginBottom: 8 }}>{t.portfolio}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[UZ.skySoft, UZ.emeraldSoft, UZ.pinkSoft, '#fef3d7', '#f0e8dc', UZ.skySoft].map((c, i) => (
            <div key={i} style={{
              aspectRatio: '1/1', borderRadius: 12,
              background: `linear-gradient(135deg, ${c}, rgba(255,255,255,0.5))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {['🔧', '🚿', '💧', '⚙️', '🧰', '🔩'][i]}
            </div>
          ))}
        </div>
      </div>

      {/* Reviews preview */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ fontSize: 13, color: UZ.ink3, marginBottom: 8 }}>{t.reviews} · 312</div>
        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Avatar name="МД" hue={4} size={32}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: UZ.ink }}>Мадина Д.</div>
              <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                {[1,2,3,4,5].map(i => ic.star(11, UZ.gold))}
              </div>
            </div>
            <span style={{ fontSize: 11, color: UZ.inkMute }}>{lang === 'ru' ? '2 дня назад' : '2 days ago'}</span>
          </div>
          <div style={{ fontSize: 13, color: UZ.ink2, lineHeight: 1.45 }}>
            {lang === 'ru'
              ? 'Приехал вовремя, починил быстро. Объяснил, что было не так. Цена как договаривались.'
              : 'Came on time, fixed it fast. Explained what was wrong. Price as agreed.'}
          </div>
        </Card>
      </div>
    </Page>
  );
}

// ─── Tracking ──────────────────────────────────────────────────────────
function ClientTracking({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <Page hasStatusPad={false} scroll={false}>
      {/* Map fills whole top */}
      <div style={{ position: 'absolute', inset: '0 0 320px 0' }}>
        <MapPlaceholder height="100%" />
        {/* status pad overlay */}
        <div style={{
          position: 'absolute', top: 54, left: 16, right: 16,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
          padding: '12px 16px', borderRadius: 16,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        }}>
          <Dot color={UZ.accent} glow size={10}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: UZ.ink }}>{t.onTheWay}</div>
            <div style={{ fontSize: 12, color: UZ.ink3 }}>{t.arrives} 14:32 · 8 {lang === 'ru' ? 'мин' : 'min'}</div>
          </div>
          {ic.chevron(16, UZ.ink3)}
        </div>
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 320,
        background: UZ.card, borderRadius: '24px 24px 0 0',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.08)',
        padding: '12px 20px 36px',
      }}>
        {/* grabber */}
        <div style={{ width: 36, height: 4, borderRadius: 4, background: UZ.lineStrong, margin: '0 auto 14px' }}/>

        {/* master row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar name="Алишер К." hue={0} size={52}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: UZ.ink }}>Алишер К.</span>
              {ic.shield(14, UZ.emerald)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {ic.star(11, UZ.gold)}
              <span style={{ fontSize: 12, fontWeight: 600 }}>4.9</span>
              <span style={{ fontSize: 12, color: UZ.inkMute }}>· 01 A 123 BB</span>
            </div>
          </div>
          <button style={{
            width: 44, height: 44, borderRadius: 14, background: UZ.emerald,
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{ic.phone(20, '#fff')}</button>
          <button style={{
            width: 44, height: 44, borderRadius: 14, background: UZ.ink,
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{ic.chat(20, '#fff')}</button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
          {[
            { l: lang === 'ru' ? 'Принят' : 'Accepted', done: true },
            { l: lang === 'ru' ? 'В пути' : 'En route', done: true, active: true },
            { l: lang === 'ru' ? 'Прибыл' : 'Arrived', done: false },
            { l: lang === 'ru' ? 'Готово' : 'Done', done: false },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 56 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 12,
                  background: s.done ? UZ.accent : UZ.line,
                  boxShadow: s.active ? `0 0 0 4px ${UZ.accent}33` : 'none',
                }}/>
                <span style={{ fontSize: 10, color: s.done ? UZ.ink : UZ.inkMute, fontWeight: s.active ? 600 : 400 }}>{s.l}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex: 1, height: 2, background: arr[i].done && arr[i + 1].done ? UZ.accent : (arr[i].done ? `linear-gradient(90deg, ${UZ.accent}, ${UZ.line})` : UZ.line), marginTop: -16 }}/>
              )}
            </React.Fragment>
          ))}
        </div>

        <button style={{
          width: '100%', padding: '12px', borderRadius: 14,
          background: 'transparent', border: `1px solid ${UZ.line}`,
          color: UZ.ink3, fontSize: 14, fontWeight: 500,
        }}>{t.cancelOrder}</button>
      </div>
    </Page>
  );
}

// ─── Chat ──────────────────────────────────────────────────────────────
function ClientChat({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  const msgs = [
    { from: 'them', text: lang === 'ru' ? 'Здравствуйте! Я в 8 минутах от вас.' : 'Hello! I\'m 8 min away.', t: '14:24' },
    { from: 'me', text: lang === 'ru' ? 'Хорошо, домофон не работает, я открою.' : 'Ok, intercom is broken, I\'ll let you in.', t: '14:25' },
    { from: 'them', text: lang === 'ru' ? 'Понял. На фото вижу — нужна прокладка, у меня есть.' : 'Got it. From the photo — need a gasket, have one.', t: '14:25' },
    { from: 'me', text: lang === 'ru' ? 'Отлично, спасибо!' : 'Great, thanks!', t: '14:26' },
  ];
  return (
    <Page hasStatusPad={false} scroll={false}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 54,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${UZ.line}`, zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 12px' }}>
          {ic.chevron(20, UZ.ink, 'left')}
          <Avatar name="Алишер К." hue={0} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: UZ.ink }}>Алишер К.</div>
            <div style={{ fontSize: 11, color: UZ.emerald, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Dot color={UZ.emerald} size={6}/>{t.online}
            </div>
          </div>
          <button style={{ width: 36, height: 36, borderRadius: 12, background: UZ.emerald, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {ic.phone(16, '#fff')}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ position: 'absolute', top: 116, bottom: 90, left: 0, right: 0, padding: '16px 16px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ textAlign: 'center', fontSize: 11, color: UZ.inkMute, fontFamily: UZ.mono, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 8px' }}>
          {lang === 'ru' ? 'Сегодня' : 'Today'}
        </div>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
            maxWidth: '78%',
          }}>
            <div style={{
              padding: '10px 14px', borderRadius: 18,
              background: m.from === 'me' ? UZ.ink : UZ.card,
              color: m.from === 'me' ? '#fff' : UZ.ink,
              fontSize: 14, lineHeight: 1.35,
              borderBottomRightRadius: m.from === 'me' ? 4 : 18,
              borderBottomLeftRadius: m.from === 'me' ? 18 : 4,
              border: m.from === 'me' ? 'none' : `1px solid ${UZ.line}`,
            }}>{m.text}</div>
            <div style={{ fontSize: 10, color: UZ.inkMute, marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left', paddingInline: 6 }}>{m.t}</div>
          </div>
        ))}
        {/* photo msg */}
        <div style={{ alignSelf: 'flex-start' }}>
          <div style={{
            width: 140, height: 100, borderRadius: 16,
            background: `linear-gradient(135deg, ${UZ.skySoft}, ${UZ.emeraldSoft})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${UZ.line}`,
          }}>
            <span style={{ fontSize: 32 }}>🔧</span>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '10px 12px 30px', background: UZ.card,
        borderTop: `1px solid ${UZ.line}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ic.plus(20)}
        </div>
        <div style={{
          flex: 1, padding: '10px 14px', borderRadius: 22, background: UZ.bg,
          fontSize: 14, color: UZ.inkMute,
        }}>{t.typeMsg}</div>
        <div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {ic.send(18, '#fff')}
        </div>
      </div>
    </Page>
  );
}

// ─── Payment ───────────────────────────────────────────────────────────
function ClientPayment({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <Page>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px' }}>
        <div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${UZ.line}` }}>
          {ic.chevron(16, UZ.ink, 'left')}
        </div>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{t.payTitle}</span>
        <span style={{ width: 38, height: 38 }}/>
      </div>

      {/* Total hero */}
      <div style={{ padding: '20px 20px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: UZ.ink3, fontFamily: UZ.mono, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{t.total}</div>
        <div style={{ fontFamily: UZ.serif, fontSize: 48, fontWeight: 700, color: UZ.ink, letterSpacing: '-0.02em' }}>
          200 000 <span style={{ fontSize: 20, color: UZ.ink3 }}>{lang === 'ru' ? 'сум' : 'UZS'}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ padding: '0 20px 16px' }}>
        <Card style={{ padding: 16 }}>
          {[
            { l: t.workCost, v: '180 000' },
            { l: lang === 'ru' ? 'Материалы' : 'Materials', v: '15 000' },
            { l: t.serviceFee, v: '5 000' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 0',
              borderBottom: i < 2 ? `1px solid ${UZ.line}` : 'none',
            }}>
              <span style={{ fontSize: 14, color: UZ.ink3 }}>{r.l}</span>
              <span style={{ fontSize: 14, color: UZ.ink, fontWeight: 500 }}>{r.v}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Methods */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 13, color: UZ.ink3, marginBottom: 8 }}>{t.payMethod}</div>
        <Card style={{ padding: 0 }}>
          {[
            { l: 'Click', v: '·· 4521', sel: true, icon: '💳' },
            { l: 'Payme', v: '·· 8842', sel: false, icon: '💳' },
            { l: lang === 'ru' ? 'Наличные' : 'Cash', v: lang === 'ru' ? 'мастеру' : 'to pro', sel: false, icon: '💵' },
          ].map((m, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${UZ.line}` : 'none',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: UZ.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.l}</div>
                <div style={{ fontSize: 12, color: UZ.ink3 }}>{m.v}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: 22,
                border: `2px solid ${m.sel ? UZ.accent : UZ.lineStrong}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {m.sel && <div style={{ width: 10, height: 10, borderRadius: 10, background: UZ.accent }}/>}
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Safe deal */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', gap: 10, padding: 12, background: UZ.emeraldSoft, borderRadius: 14 }}>
          {ic.shield(18, UZ.emerald)}
          <span style={{ fontSize: 12, color: UZ.ink2, lineHeight: 1.4 }}>{t.safeDeal}</span>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <CTA color={UZ.ink}>{t.payNow} 200 000</CTA>
      </div>
    </Page>
  );
}

// ─── Rating ────────────────────────────────────────────────────────────
function ClientRating({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  return (
    <Page>
      <div style={{ padding: '20px 20px 8px', display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 14, color: UZ.ink3 }}>{t.skip}</span>
      </div>

      <div style={{ padding: '40px 20px 24px', textAlign: 'center' }}>
        <Avatar name="Алишер К." hue={0} size={88}/>
        <div style={{ fontFamily: UZ.serif, fontSize: 28, fontWeight: 700, color: UZ.ink, marginTop: 16, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {t.howWas} <em style={{ fontWeight: 300, color: UZ.accent }}>?</em>
        </div>
        <div style={{ fontSize: 14, color: UZ.ink3, marginTop: 8 }}>
          {lang === 'ru' ? 'Алишер починил кран' : 'Alisher fixed your faucet'}
        </div>
      </div>

      {/* Stars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i}>{ic.star(36, i <= 5 ? UZ.gold : UZ.line)}</div>
        ))}
      </div>

      {/* Tags */}
      <div style={{ padding: '0 20px 20px', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {[
          { l: lang === 'ru' ? 'Вовремя' : 'On time', sel: true },
          { l: lang === 'ru' ? 'Качественно' : 'Quality work', sel: true },
          { l: lang === 'ru' ? 'Чисто' : 'Tidy', sel: false },
          { l: lang === 'ru' ? 'Вежливый' : 'Polite', sel: true },
          { l: lang === 'ru' ? 'Цена честная' : 'Fair price', sel: false },
        ].map((tg, i) => (
          <div key={i} style={{
            padding: '8px 14px', borderRadius: 999,
            background: tg.sel ? UZ.ink : 'transparent',
            color: tg.sel ? '#fff' : UZ.ink2,
            border: `1px solid ${tg.sel ? UZ.ink : UZ.line}`,
            fontSize: 13, fontWeight: 500,
          }}>{tg.l}</div>
        ))}
      </div>

      {/* Note */}
      <div style={{ padding: '0 20px 20px' }}>
        <Card style={{ padding: 14, minHeight: 80 }}>
          <div style={{ fontSize: 14, color: UZ.ink, lineHeight: 1.4 }}>
            {lang === 'ru'
              ? 'Алишер приехал даже раньше, всё объяснил, починил быстро. Рекомендую!'
              : 'Alisher arrived even earlier, explained everything, fixed it fast. Recommend!'}
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 20px' }}>
        <CTA color={UZ.accent}>{t.sendReview}</CTA>
      </div>
    </Page>
  );
}

// ─── History ───────────────────────────────────────────────────────────
function ClientHistory({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  const orders = [
    { cat: t.catPlumb, sub: lang === 'ru' ? 'Замена крана' : 'Faucet replacement', date: lang === 'ru' ? 'Сегодня, 14:30' : 'Today, 14:30', price: '200 000', status: 'active', master: 'Алишер К.', icon: '🔧', bg: UZ.skySoft },
    { cat: t.catClean, sub: lang === 'ru' ? 'Генеральная уборка' : 'Deep clean', date: lang === 'ru' ? '12 апр' : 'Apr 12', price: '450 000', status: 'completed', master: 'Зухра А.', icon: '🧽', bg: UZ.emeraldSoft },
    { cat: t.catElec, sub: lang === 'ru' ? 'Розетка на кухне' : 'Kitchen outlet', date: lang === 'ru' ? '5 апр' : 'Apr 5', price: '120 000', status: 'completed', master: 'Дилшод М.', icon: '⚡', bg: '#fef3d7' },
    { cat: t.catFurn, sub: lang === 'ru' ? 'Сборка шкафа' : 'Wardrobe assembly', date: lang === 'ru' ? '28 мар' : 'Mar 28', price: '180 000', status: 'cancelled', master: 'Бахтиёр С.', icon: '🪑', bg: '#f0e8dc' },
  ];
  return (
    <Page hasTabBar>
      <AppTop
        left={<div style={{ fontFamily: UZ.serif, fontSize: 32, fontWeight: 700, letterSpacing: '-0.035em' }}>{t.historyTitle}</div>}
        right={<div style={{ width: 38, height: 38, borderRadius: 38, background: UZ.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${UZ.line}` }}>{ic.search(18)}</div>}
      />

      {/* Tabs */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', gap: 8 }}>
        {[
          { l: lang === 'ru' ? 'Активные' : 'Active', sel: false, count: 1 },
          { l: t.completed, sel: true, count: 24 },
          { l: t.cancelled, sel: false, count: 2 },
        ].map((tab, i) => (
          <div key={i} style={{
            padding: '8px 14px', borderRadius: 999,
            background: tab.sel ? UZ.ink : UZ.card,
            color: tab.sel ? '#fff' : UZ.ink2,
            border: `1px solid ${tab.sel ? UZ.ink : UZ.line}`,
            fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tab.l}
            <span style={{ opacity: 0.6, fontSize: 11 }}>{tab.count}</span>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: '0 12px' }}>
        {orders.map((o, i) => (
          <OrderRow key={i}
            icon={<span style={{ fontSize: 20 }}>{o.icon}</span>}
            iconBg={o.bg}
            title={`${o.cat} · ${o.master}`}
            sub={o.sub}
            meta={[
              <Chip key="d" bg={UZ.bg} color={UZ.ink3}>{o.date}</Chip>,
              o.status === 'active' && <Chip key="s" bg={UZ.emeraldSoft} color={UZ.emerald}>{lang === 'ru' ? 'В работе' : 'In progress'}</Chip>,
              o.status === 'cancelled' && <Chip key="s" bg={UZ.pinkSoft} color={UZ.pink}>{t.cancelled}</Chip>,
            ].filter(Boolean)}
            right={
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: UZ.serif }}>{o.price}</div>
                <div style={{ fontSize: 10, color: UZ.inkMute }}>{lang === 'ru' ? 'сум' : 'UZS'}</div>
              </div>
            }
          />
        ))}
      </div>

      <TabBar active={1} tabs={[
        { icon: ic.home, label: t.tabHome },
        { icon: ic.list, label: t.tabOrders },
        { icon: ic.chat, label: t.tabChat },
        { icon: ic.user, label: t.tabProfile },
      ]}/>
    </Page>
  );
}

// ─── Profile ───────────────────────────────────────────────────────────
function ClientProfile({ lang = 'ru' }) {
  const t = APP_I18N[lang];
  const items = [
    { l: t.myAddresses, c: '3', icon: ic.pin(18, UZ.ink2), bg: UZ.skySoft },
    { l: t.payMethods, c: '2', icon: ic.wallet(18, UZ.ink2), bg: UZ.emeraldSoft },
    { l: t.notifications, icon: ic.bell(18, UZ.ink2), bg: UZ.pinkSoft },
    { l: t.language, c: lang === 'ru' ? 'Русский' : 'English', icon: <span style={{ fontSize: 18 }}>🌐</span>, bg: '#fef3d7' },
    { l: t.support, icon: ic.chat(18, UZ.ink2), bg: '#f0e8dc' },
    { l: t.referral, c: lang === 'ru' ? 'Бонус 50 000' : '50,000 bonus', icon: <span style={{ fontSize: 18 }}>🎁</span>, bg: UZ.accent + '22' },
  ];
  return (
    <Page hasTabBar>
      <AppTop
        left={<div style={{ fontFamily: UZ.serif, fontSize: 32, fontWeight: 700, letterSpacing: '-0.035em' }}>{t.tabProfile}</div>}
        right={<UzLogo size={20} color={UZ.ink}/>}
      />

      {/* User card */}
      <div style={{ padding: '12px 20px 24px' }}>
        <Card style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name="Айгуль К." hue={2} size={56}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: UZ.serif, fontSize: 20, fontWeight: 700, color: UZ.ink }}>Айгуль К.</div>
            <div style={{ fontSize: 13, color: UZ.ink3, marginTop: 2 }}>+998 90 123 45 67</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Chip bg={UZ.gold + '33'} color={UZ.ink}>★ 4.8</Chip>
              <Chip bg={UZ.bg} color={UZ.ink2}>27 {t.tabOrders.toLowerCase()}</Chip>
            </div>
          </div>
        </Card>
      </div>

      {/* Menu list */}
      <div style={{ padding: '0 20px' }}>
        <Card style={{ padding: 0 }}>
          {items.map((it, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${UZ.line}` : 'none',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: it.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {it.icon}
              </div>
              <span style={{ flex: 1, fontSize: 15, color: UZ.ink, fontWeight: 500 }}>{it.l}</span>
              {it.c && <span style={{ fontSize: 13, color: UZ.ink3, marginRight: 4 }}>{it.c}</span>}
              {ic.chevron(14, UZ.ink3)}
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: UZ.ink3 }}>{t.logout}</span>
      </div>

      <TabBar active={3} tabs={[
        { icon: ic.home, label: t.tabHome },
        { icon: ic.list, label: t.tabOrders },
        { icon: ic.chat, label: t.tabChat },
        { icon: ic.user, label: t.tabProfile },
      ]}/>
    </Page>
  );
}

Object.assign(window, {
  ClientOnboarding, ClientHome, ClientCreateOrder, ClientMatches,
  ClientMasterProfile, ClientTracking, ClientChat, ClientPayment,
  ClientRating, ClientHistory, ClientProfile,
});
