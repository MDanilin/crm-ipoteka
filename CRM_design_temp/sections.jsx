// "Why UzUsta" — bento card grid with hover reveal + Safety section + App + Footer

function WhyUzUsta() {
  const { t } = useLang();
  return (
    <section id="why" className="sec" style={{ background: 'var(--bg-elev)' }}>
      <div className="uzu-container">
        <div className="sec-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 24 }}><span className="dot"></span>{t.why.eyebrow}</div>
            <h2>{t.why.title} <em>{t.why.title_em}</em></h2>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: 'var(--line)',
          border: '1px solid var(--line)',
          borderRadius: 22,
          overflow: 'hidden',
        }} className="why-grid">
          {t.why.cards.map((c, i) => <WhyCard key={i} c={c} idx={i}/>)}
        </div>
      </div>
      <style>{`
        @media (max-width: 980px) { .why-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .why-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

function WhyCard({ c, idx }) {
  const ref = useReveal();
  const [hovered, setHovered] = useState(false);
  // Each card gets its own playful accent color
  const palettes = [
    { bg: '#fff8ee', accent: '#ff6b35', dark: '#0e1a18' },
    { bg: '#e3f5ec', accent: '#1f9d6e', dark: '#0e1a18' },
    { bg: '#fff1d6', accent: '#ffb547', dark: '#0e1a18' },
    { bg: '#ffe4ea', accent: '#ff6b35', dark: '#0e1a18' },
    { bg: '#e8f0fb', accent: '#4a90e2', dark: '#0e1a18' },
    { bg: '#fff8ee', accent: '#1f9d6e', dark: '#0e1a18' },
  ];
  const p = palettes[idx % palettes.length];
  return (
    <div
      ref={ref}
      className="reveal"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? p.accent : p.bg,
        color: hovered ? '#fff' : p.dark,
        padding: '40px 32px 36px',
        minHeight: 280,
        position: 'relative',
        transition: 'background 0.5s var(--ease), color 0.5s var(--ease)',
        cursor: 'pointer',
        transitionDelay: `${idx * 60}ms`,
      }}
    >
      <div style={{
        position: 'absolute', top: 32, right: 32,
        fontFamily: 'var(--mono)', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.14em',
        color: hovered ? 'rgba(255,255,255,0.85)' : p.accent,
        fontWeight: 600,
      }}>{c.tag}</div>
      <div style={{
        fontFamily: 'var(--serif)', fontSize: 64, fontWeight: 300,
        color: hovered ? 'rgba(255,255,255,0.4)' : 'rgba(14,26,24,0.18)',
        lineHeight: 1, marginBottom: 24,
        transform: hovered ? 'translateX(-4px)' : 'none',
        transition: 'all 0.6s var(--ease)',
      }}>{String(idx + 1).padStart(2, '0')}</div>
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.1, marginBottom: 12 }}>{c.t}</h3>
      <p style={{ fontSize: 14, opacity: hovered ? 0.92 : 0.65, lineHeight: 1.55 }}>{c.d}</p>
      <div style={{
        position: 'absolute', bottom: 32, right: 32,
        opacity: hovered ? 1 : 0,
        transform: `translateX(${hovered ? 0 : -8}px)`,
        transition: 'all 0.4s var(--ease)',
        color: '#fff',
      }}><Arrow/></div>
    </div>
  );
}

function Safety() {
  const { t } = useLang();
  const ref = useReveal();
  return (
    <section id="safety" className="sec" style={{ background: 'var(--bg)' }}>
      <div className="uzu-container">
        <div className="sec-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 24 }}><span className="dot"></span>{t.safety.eyebrow}</div>
            <h2>{t.safety.title} <em>{t.safety.title_em}</em></h2>
          </div>
          <p>{t.safety.sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60 }} className="safety-grid">
          <div ref={ref} className="reveal" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 0,
            border: '1px solid var(--line)',
            borderRadius: 22,
            overflow: 'hidden',
            background: 'var(--bg-elev)',
          }}>
            {t.safety.checks.map((c, i) => (
              <div key={i} style={{
                padding: '28px 24px',
                borderRight: i % 2 === 0 ? '1px solid var(--line)' : 'none',
                borderBottom: i < 4 ? '1px solid var(--line)' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                minHeight: 110,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}><Check size={14}/></div>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 4 }}>Шаг {String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>{c}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--ink)', color: 'var(--on-dark)',
            borderRadius: 22, padding: 40,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden',
            minHeight: 400,
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 220, height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
              opacity: 0.4,
            }}/>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'rgba(246,241,231,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 28,
                border: '1px solid var(--line-dark)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="1.4">
                  <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-0.5 8-5 8-10V6l-8-4z"/>
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="eyebrow" style={{ color: 'var(--accent-2)', marginBottom: 14 }}>{t.safety.guarantee_t}</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 16 }}>{t.safety.guarantee_d}</h3>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', background: 'rgba(246,241,231,0.06)',
              borderRadius: 14, fontSize: 13,
              border: '1px solid var(--line-dark)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5fd17a' }}/>
              98.4% заказов закрыты без споров
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 980px) { .safety-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

function AppDownload() {
  const { t } = useLang();
  return (
    <section id="app" className="sec" style={{
      background: 'linear-gradient(180deg, #fff8ee 0%, #fff1d6 100%)',
      paddingTop: 140, paddingBottom: 140,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 800,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 60%)',
        pointerEvents: 'none',
      }}/>
      <div className="uzu-container" style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'center' }} className="app-grid">
          <div>
            <div className="eyebrow" style={{ marginBottom: 28 }}><span className="dot"></span>{t.app.eyebrow}</div>
            <h2 className="display" style={{
              fontSize: 'clamp(48px, 7vw, 96px)',
              marginBottom: 28,
            }}>{t.app.title} <em style={{ color: 'var(--accent)' }}>{t.app.title_em}</em></h2>
            <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: 520, marginBottom: 40, lineHeight: 1.55 }}>{t.app.sub}</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
              <Magnetic><a href="#" className="store-btn">
                <svg width="22" height="26" viewBox="0 0 22 26" fill="currentColor"><path d="M16.5 13.6c0-3 2.4-4.4 2.5-4.5-1.4-2-3.5-2.3-4.2-2.3-1.8-0.2-3.5 1-4.4 1-0.9 0-2.3-1-3.8-1C4.7 6.9 3 8 2 9.7c-1.9 3.3-0.5 8.2 1.4 10.9 0.9 1.3 2 2.8 3.5 2.7 1.4-0.1 1.9-0.9 3.6-0.9 1.7 0 2.2 0.9 3.7 0.9 1.5 0 2.5-1.3 3.4-2.6 1.1-1.5 1.5-3 1.5-3.1-0.1-0-2.9-1.1-2.9-4.4zM13.7 5c0.7-0.9 1.3-2.2 1.1-3.5-1.1 0-2.4 0.7-3.2 1.7-0.7 0.8-1.3 2.1-1.1 3.4 1.2 0.1 2.4-0.6 3.2-1.6z"/></svg>
                <span><div className="store-pre">Coming soon</div><div className="store-name">App Store</div></span>
              </a></Magnetic>
              <Magnetic><a href="#" className="store-btn">
                <svg width="24" height="26" viewBox="0 0 24 26" fill="currentColor"><path d="M3.6 1.5c-0.4 0.4-0.6 1-0.6 1.8v19.4c0 0.8 0.2 1.4 0.6 1.8l0.1 0.1L14.5 13.6v-0.2L3.6 1.5z M18.1 17.2l-3.6-3.6V13.4l3.6-3.6 0.1 0.1 4.3 2.4c1.2 0.7 1.2 1.8 0 2.5l-4.4 2.4z M14.5 13.6l-10.9 11c0.4 0.4 1 0.5 1.8 0l13-7.4-3.9-3.6z M14.5 13.4l-13-7.4c-0.8-0.5-1.4-0.4-1.8 0L14.5 13.4z"/></svg>
                <span><div className="store-pre">Coming soon</div><div className="store-name">Google Play</div></span>
              </a></Magnetic>
            </div>

          </div>

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <FloatingPhones/>
          </div>
        </div>

        <div style={{
          marginTop: 100,
          padding: '32px 40px',
          borderRadius: 22,
          background: 'var(--ink)',
          color: 'var(--on-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, flexWrap: 'wrap',
        }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-2)', marginBottom: 8 }}>Для мастеров</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.015em' }}>
              Зарабатывайте больше — без посредников и звонков целый день
            </div>
          </div>
          <Magnetic><a href="#" className="btn" style={{ background: 'var(--accent)', color: '#fff', padding: '18px 28px' }}>{t.app.master_cta}<Arrow/></a></Magnetic>
        </div>
      </div>

      <style>{`
        .store-btn {
          display: inline-flex; align-items: center; gap: 12px;
          padding: 14px 22px;
          border: 1px solid var(--line);
          border-radius: 14px;
          color: var(--ink);
          background: #fff;
          transition: all 0.3s var(--ease);
        }
        .store-btn:hover { background: var(--ink); color: var(--on-dark); border-color: var(--ink); }
        .store-pre { font-size: 10px; opacity: 0.7; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1; margin-bottom: 4px; }
        .store-name { font-size: 17px; font-weight: 500; line-height: 1; }
        @media (max-width: 980px) { .app-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

function FloatingPhones() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 460, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', left: '8%', top: '8%',
        width: 220, aspectRatio: '0.5',
        background: '#0e1a18', borderRadius: 36,
        padding: 8, transform: 'rotate(-8deg)',
        boxShadow: '0 40px 80px -30px rgba(0,0,0,0.4)',
        animation: 'float1 6s ease-in-out infinite',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 28, background: 'linear-gradient(180deg, #fff8ee, #fff1d6)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '40px 16px 16px' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', marginBottom: 12 }}>Заказы</div>
            {[
              { c: '#ff6b35', t: 'Сантехника' },
              { c: '#1f9d6e', t: 'Уборка' },
              { c: '#4a90e2', t: 'Электрика' },
            ].map((x, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 8, marginBottom: 6, border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 28, borderRadius: 3, background: x.c }}/>
                <div>
                  <div style={{ fontSize: 9, color: '#888' }}>Сегодня · 14:00</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>{x.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{
        position: 'absolute', right: '5%', bottom: '5%',
        width: 240, aspectRatio: '0.5',
        background: '#0e1a18', borderRadius: 38,
        padding: 8, transform: 'rotate(6deg)',
        boxShadow: '0 50px 100px -30px rgba(255,107,53,0.4), 0 30px 60px -20px rgba(0,0,0,0.3)',
        animation: 'float2 7s ease-in-out infinite',
        zIndex: 2,
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 30, background: '#0e1a18', position: 'relative', overflow: 'hidden', color: '#fff' }}>
          <div style={{ padding: '36px 14px 14px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>В пути</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 8 }}>18 мин</div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b35, #ffb547)' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600 }}>Алишер К.</div>
                  <div style={{ fontSize: 8, opacity: 0.6 }}>★ 4.94</div>
                </div>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 6 }}>
              <div style={{ width: '62%', height: '100%', background: 'var(--accent)' }}/>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes float1 { 0%,100% { transform: rotate(-8deg) translateY(0); } 50% { transform: rotate(-8deg) translateY(-12px); } }
        @keyframes float2 { 0%,100% { transform: rotate(6deg) translateY(0); } 50% { transform: rotate(6deg) translateY(-16px); } }
      `}</style>
    </div>
  );
}

function Footer() {
  const { t, lang, setLang } = useLang();
  return (
    <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--line)', padding: '80px 0 40px' }}>
      <div className="uzu-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 60 }} className="footer-grid">
          <div>
            <a href="#top" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 24, marginBottom: 16 }}>
              <Logo/> UzUsta
            </a>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 320, lineHeight: 1.55, marginBottom: 24 }}>
              {lang === 'ru' ? 'Платформа поиска и бронирования мастеров. Скоро запуск в Узбекистане.' : 'A platform to find and book home service pros. Launching soon in Uzbekistan.'}
            </p>
            <div className="tag">📍 {t.footer.tag}</div>
          </div>
          {t.footer.cols.map((col, i) => (
            <div key={i}>
              <div className="eyebrow" style={{ marginBottom: 18 }}>{col.t}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.items.map(it => (
                  <li key={it}><a href="#" style={{ fontSize: 15, color: 'var(--ink-2)', transition: 'color 0.3s var(--ease)' }} onMouseEnter={e => e.target.style.color = 'var(--accent)'} onMouseLeave={e => e.target.style.color = 'var(--ink-2)'}>{it}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <div>{t.footer.copy}</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Разработка: Gavhar Labs LLC</span>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="mailto:hi@uzusta.uz">hi@uzusta.uz</a>
          </div>
        </div>

        {/* Giant brand wordmark */}
        <div style={{ marginTop: 80, fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(80px, 22vw, 320px)', letterSpacing: '-0.04em', lineHeight: 0.85, color: 'transparent', WebkitTextStroke: '1px var(--ink)', textAlign: 'center' }}>
          <span>Uz<em style={{ color: 'var(--accent)', WebkitTextStroke: '0' }}>Usta</em></span>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 540px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}

Object.assign(window, { WhyUzUsta, Safety, AppDownload, Footer });
