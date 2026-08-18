// Hero section — bold, warm, video-bg placeholder, magnetic CTA, ticker
const heroStyles = {
  hero: {
    position: 'relative',
    minHeight: '100vh',
    paddingTop: 96,
    paddingBottom: 60,
    overflow: 'hidden',
    background: 'var(--bg)',
    isolation: 'isolate',
  },
  videoWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  grid: {
    position: 'relative',
    zIndex: 2,
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr',
    gap: 60,
    alignItems: 'end',
    minHeight: 'calc(100vh - 200px)',
  },
};

function VideoPlaceholder() {
  // Looping subtle parallax of "scenes" — fake video bg
  const scenes = [
    { label: 'PLUMBER · KITCHEN', hue: 24, accent: '#ff6b35' },
    { label: 'ELECTRICIAN · LIVING ROOM', hue: 42, accent: '#ffb547' },
    { label: 'CLEANER · BATHROOM', hue: 160, accent: '#34c08a' },
    { label: 'AC TECH · BEDROOM', hue: 200, accent: '#4a90e2' },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(v => (v + 1) % scenes.length), 4200);
    return () => clearInterval(id);
  }, []);
  const s = scenes[i];

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {scenes.map((sc, idx) => (
        <div key={idx} style={{
          position: 'absolute', inset: 0,
          opacity: idx === i ? 1 : 0,
          transition: 'opacity 1.4s cubic-bezier(0.22,1,0.36,1)',
          background: `radial-gradient(60% 80% at 70% 60%, ${sc.accent}33, transparent 70%), linear-gradient(180deg, hsl(${sc.hue}, 60%, 94%) 0%, hsl(${sc.hue}, 55%, 86%) 100%)`,
        }}>
          {/* "video scene" — abstract scrolling stripes */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(110deg, transparent 0 60px, rgba(0,0,0,0.02) 60px 61px)`,
            animation: 'heroScroll 18s linear infinite',
          }}/>
          {/* Soft figure silhouette */}
          <div style={{
            position: 'absolute',
            right: '8%', bottom: 0,
            width: '42%', height: '78%',
            background: `radial-gradient(40% 50% at 50% 30%, ${sc.accent}55, transparent 70%)`,
            filter: 'blur(24px)',
            opacity: 0.6,
            transform: `scale(${1 + idx * 0.02})`,
            transition: 'transform 8s ease-out',
          }}/>
        </div>
      ))}
      {/* Foreground gradient to ensure contrast */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,248,238,0.55) 0%, rgba(255,248,238,0.15) 50%, rgba(255,248,238,0.85) 100%)',
      }}/>
      {/* Scene label */}
      <div style={{
        position: 'absolute', top: 24, right: 32,
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
        color: 'var(--ink-3)', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.6s ease-in-out infinite' }}/>
        REC · {s.label}
      </div>
      {/* Scene dots */}
      <div style={{ position: 'absolute', bottom: 24, right: 32, display: 'flex', gap: 6 }}>
        {scenes.map((_, idx) => (
          <div key={idx} style={{
            width: idx === i ? 24 : 6, height: 2,
            background: idx === i ? 'var(--accent)' : 'var(--ink-3)',
            transition: 'all 0.6s var(--ease)', opacity: idx === i ? 1 : 0.4,
          }}/>
        ))}
      </div>
    </div>
  );
}

function Ticker({ items }) {
  const doubled = [...items, ...items, ...items];
  return (
    <div style={{
      position: 'relative',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
      padding: '18px 0',
      overflow: 'hidden',
      background: 'var(--bg-elev)',
    }}>
      <div style={{
        display: 'flex', gap: 48,
        whiteSpace: 'nowrap',
        animation: 'tickerScroll 38s linear infinite',
        fontFamily: 'var(--serif)',
        fontSize: 22, fontWeight: 300,
        color: 'var(--ink-2)',
      }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 48 }}>
            {item}
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--sans)', fontStyle: 'normal' }}>✦</span>
        </span>
        ))}
      </div>
    </div>
  );
}

function HeroStat({ v, l, delay = 0 }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms` }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', marginTop: 8 }}>{l}</div>
    </div>
  );
}

function NavBar() {
  const { lang, t, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: scrolled ? '14px 0' : '24px 0',
      background: scrolled ? 'rgba(246,241,231,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px) saturate(150%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(150%)' : 'none',
      borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      transition: 'all 0.5s var(--ease)',
    }}>
      <div className="uzu-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em' }}>
          <Logo />
          <span>UzUsta</span>
        </a>
        <div className="uzu-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#how" className="uzu-nav-link">{t.nav.how}</a>
          <a href="#why" className="uzu-nav-link">{t.nav.why}</a>
          <a href="#safety" className="uzu-nav-link">{t.nav.safety}</a>
          <a href="#app" className="uzu-nav-link">{t.nav.app}</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1px solid var(--line)', borderRadius: 999,
            padding: 3, background: 'var(--bg-elev)',
            fontSize: 12, fontFamily: 'var(--mono)',
          }}>
            {['ru','en'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '6px 12px', borderRadius: 999,
                background: lang === l ? 'var(--ink)' : 'transparent',
                color: lang === l ? 'var(--on-dark)' : 'var(--ink-3)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                transition: 'all 0.3s var(--ease)',
              }}>{l}</button>
            ))}
          </div>
          <a href="#app" className="btn btn-primary" style={{ padding: '12px 22px', fontSize: 14 }}>
            {t.nav.cta}<Arrow size={14}/>
          </a>
        </div>
      </div>
      <style>{`
        .uzu-nav-link {
          padding: 10px 14px; font-size: 14px; color: var(--ink-2);
          border-radius: 999px; transition: all 0.3s var(--ease);
        }
        .uzu-nav-link:hover { background: var(--bg-elev); color: var(--ink); }
        @media (max-width: 900px) { .uzu-nav-links { display: none !important; } }
      `}</style>
    </nav>
  );
}

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="#1a1612"/>
      <path d="M10 11 L10 18 Q10 22 16 22 Q22 22 22 18 L22 11" stroke="#f6f1e7" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <circle cx="16" cy="9" r="1.5" fill="#c84a1f"/>
    </svg>
  );
}

function Hero() {
  const { t } = useLang();
  const heroRef = useRef(null);

  return (
    <section id="top" style={heroStyles.hero}>
      <div style={heroStyles.videoWrap}>
        <VideoPlaceholder />
      </div>

      <div className="uzu-container" style={{ position: 'relative', zIndex: 2, paddingTop: 60 }}>
        <div ref={heroRef} style={heroStyles.grid}>
          <div>
            <div className="reveal is-in" style={{ marginBottom: 28 }}>
              <span className="eyebrow"><span className="dot"></span>{t.hero.eyebrow}</span>
            </div>
            <h1 className="display" style={{
              fontSize: 'clamp(56px, 9.5vw, 144px)',
              marginBottom: 32,
            }}>
              {t.hero.title_lines.map((line, i) => (
                <span key={i} className="reveal-line is-in" style={{ transitionDelay: `${i * 120}ms` }}>
                  <span style={{ display: 'block' }}>
                    {i === t.hero.title_lines.length - 1 ? (
                      <>{line} <em style={{ color: 'var(--accent)' }}>{t.hero.title_em}</em></>
                    ) : line}
                  </span>
                </span>
              ))}
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 1.5vw, 20px)',
              color: 'var(--ink-2)',
              maxWidth: 540,
              marginBottom: 40,
              lineHeight: 1.55,
            }}>{t.hero.sub}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <Magnetic strength={0.25}>
                <a href="#app" className="btn btn-primary" style={{ padding: '20px 32px', fontSize: 16 }}>
                  {t.hero.cta_primary}<Arrow/>
                </a>
              </Magnetic>
              <Magnetic strength={0.2}>
                <a href="#app" className="btn btn-ghost" style={{ padding: '20px 32px', fontSize: 16 }}>
                  {t.hero.cta_secondary}
                </a>
              </Magnetic>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-end' }}>
            <FloatingCard />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 32,
              width: '100%',
              padding: '24px 0',
              borderTop: '1px solid var(--line)',
            }}>
              <HeroStat v={t.hero.stat_a_v} l={t.hero.stat_a_l} delay={100}/>
              <HeroStat v={t.hero.stat_b_v} l={t.hero.stat_b_l} delay={200}/>
              <HeroStat v={t.hero.stat_c_v} l={t.hero.stat_c_l} delay={300}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 60 }}>
        <Ticker items={t.hero.ticker} />
      </div>

      <style>{`
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        @keyframes heroScroll { from { transform: translateX(0); } to { transform: translateX(-120px); } }
        @media (max-width: 900px) {
          .uzu-hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// Floating "live booking" card — proof of the product working
function FloatingCard() {
  const ref = useRef(null);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage(s => (s + 1) % 4), 2200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
      const y = ((e.clientY - r.top) / r.height - 0.5) * -12;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.transform = `perspective(1200px) rotateY(${x}deg) rotateX(${y}deg)`; });
    };
    const onLeave = () => { cancelAnimationFrame(raf); el.style.transform = 'perspective(1200px) rotateY(0) rotateX(0)'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); cancelAnimationFrame(raf); };
  }, []);
  const stages = [
    { label: 'searching', text: 'Ищем мастеров поблизости...' },
    { label: 'found', text: '8 мастеров готовы взять заказ' },
    { label: 'matched', text: 'Алишер К. — в пути' },
    { label: 'eta', text: 'Прибудет через 18 минут' },
  ];

  return (
    <div ref={ref} style={{
      width: '100%', maxWidth: 380,
      background: 'var(--ink)', color: 'var(--on-dark)',
      borderRadius: 22, padding: 24,
      boxShadow: '0 30px 80px -30px rgba(0,0,0,0.5), 0 10px 30px -10px rgba(0,0,0,0.2)',
      transformStyle: 'preserve-3d',
      transition: 'transform 0.4s var(--ease)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(246,241,231,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5fd17a', animation: 'pulse 1.6s ease-in-out infinite' }}/>
          PREVIEW · UI MOCKUP
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(246,241,231,0.5)' }}>#A4821</div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'rgba(246,241,231,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Задача</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 300, lineHeight: 1.2 }}>«Подтекает кран на кухне»</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(246,241,231,0.06)', borderRadius: 14, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6b35, #ffb547)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, color: '#fff',
        }}>А</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Алишер К.</div>
          <div style={{ fontSize: 11, color: 'rgba(246,241,231,0.6)', display: 'flex', gap: 8 }}>
            <span>★ 4.94</span><span>·</span><span>312 заказов</span>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400 }}>180k</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(246,241,231,0.7)', minHeight: 18 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.4s ease-in-out infinite' }}/>
        <span style={{ transition: 'opacity 0.4s var(--ease)' }} key={stage}>{stages[stage].text}</span>
      </div>
    </div>
  );
}

Object.assign(window, { Hero, NavBar });
