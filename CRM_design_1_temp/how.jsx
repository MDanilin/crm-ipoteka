// "How it works" — large numbered steps with scroll-driven highlight + interactive phone mock
function HowItWorks() {
  const { t } = useLang();
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.5) {
          const idx = parseInt(e.target.dataset.idx, 10);
          setActive(idx);
        }
      });
    }, { threshold: [0.5, 0.7] });
    stepRefs.current.forEach(r => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section id="how" className="sec" style={{ background: 'var(--bg)' }}>
      <div className="uzu-container">
        <div className="sec-header">
          <div>
            <div className="eyebrow" style={{ marginBottom: 24 }}><span className="dot"></span>{t.how.eyebrow}</div>
            <h2>{t.how.title} <em>{t.how.title_em}</em></h2>
          </div>
          <p>{t.how.sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: 80, alignItems: 'start' }} className="how-grid">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {t.how.steps.map((s, i) => (
              <div
                key={i}
                ref={el => stepRefs.current[i] = el}
                data-idx={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: 24,
                  padding: '40px 0',
                  borderTop: '1px solid var(--line)',
                  opacity: active === i ? 1 : 0.35,
                  transition: 'opacity 0.6s var(--ease)',
                }}
              >
                <div style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 56, fontWeight: 300,
                  color: active === i ? 'var(--accent)' : 'var(--ink)',
                  transition: 'color 0.6s var(--ease)',
                  lineHeight: 1,
                }}>{s.n}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.05 }}>{s.t}</h3>
                  <p style={{ fontSize: 16, color: 'var(--ink-3)', maxWidth: 480, lineHeight: 1.55 }}>{s.d}</p>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--line)' }}/>
          </div>

          <div style={{ position: 'sticky', top: 120, alignSelf: 'start' }} className="how-phone-wrap">
            <PhoneMock active={active}/>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 980px) {
          .how-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .how-phone-wrap { position: relative !important; top: 0 !important; max-width: 380px; margin: 0 auto; }
        }
      `}</style>
    </section>
  );
}

function PhoneMock({ active }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%', aspectRatio: '0.5',
      maxWidth: 380, margin: '0 auto',
      background: 'var(--ink)', borderRadius: 48,
      padding: 12,
      boxShadow: '0 60px 120px -40px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(255,255,255,0.08)',
    }}>
      <div style={{
        width: '100%', height: '100%',
        background: 'var(--bg-elev)', borderRadius: 38,
        overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 100, height: 28, background: 'var(--ink)', borderRadius: 999, zIndex: 5 }}/>
        {/* Status bar */}
        <div style={{ padding: '14px 28px 0', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)', fontWeight: 600 }}>
          <span>9:41</span>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span>5G</span>
            <span>100%</span>
          </span>
        </div>

        <div style={{ flex: 1, padding: '50px 22px 22px', position: 'relative' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: '50px 22px 22px',
              opacity: active === i ? 1 : 0,
              transform: `translateY(${active === i ? 0 : 20}px)`,
              transition: 'all 0.6s var(--ease)',
              pointerEvents: active === i ? 'auto' : 'none',
            }}>
              <PhoneScreen step={i}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneScreen({ step }) {
  if (step === 0) {
    return (
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Что нужно сделать?</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>Опишите задачу — мы найдём мастера</div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Текст</div>
          <div style={{ fontSize: 14, lineHeight: 1.4 }}>Подтекает кран на кухне<span style={{ display: 'inline-block', width: 1, background: 'var(--accent)', height: 16, marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s steps(2) infinite' }}/></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['🎤 Голос', '📷 Фото', '📎 Файл'].map(c => (
            <div key={c} style={{ flex: 1, padding: '10px', background: 'var(--bg)', borderRadius: 12, fontSize: 11, textAlign: 'center', border: '1px solid var(--line)' }}>{c}</div>
          ))}
        </div>
        <div style={{ background: 'var(--ink)', color: 'var(--on-dark)', padding: 14, borderRadius: 14, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
          Найти мастера →
        </div>
        <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.4s ease-in-out infinite' }}/>
          ИЩЕМ · 8 ОТКЛИКОВ
        </div>
        {[
          { n: 'Алишер К.', r: '4.94', p: '180k', e: '18 мин' },
          { n: 'Бахтиёр М.', r: '4.88', p: '160k', e: '24 мин' },
          { n: 'Рустам Х.', r: '4.91', p: '200k', e: '12 мин' },
        ].map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 10, background: '#fff',
            borderRadius: 12, marginBottom: 8,
            border: '1px solid var(--line)',
            animation: `slideUp 0.5s var(--ease) ${i * 0.15}s both`,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${i * 80}, 60%, 55%), hsl(${i * 80 + 30}, 60%, 45%))` }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{m.n}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>★ {m.r} · {m.e}</div>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{m.p}</div>
          </div>
        ))}
        <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } }`}</style>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Профиль мастера</div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #c84a1f, #c89a3c)' }}/>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>Алишер К.</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Сантехник · 6 лет</div>
            </div>
            <div style={{ marginLeft: 'auto', padding: '4px 8px', background: '#5fd17a22', color: '#2a8741', borderRadius: 999, fontSize: 10, fontWeight: 600 }}>Verified</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[['4.94', 'Рейтинг'], ['312', 'Заказов'], ['98%', 'Возврат']].map(([v, l]) => (
              <div key={l} style={{ background: 'var(--bg)', borderRadius: 10, padding: 8, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{v}</div>
                <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--ink)', color: 'var(--on-dark)', padding: 12, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>Выбрать мастера</div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Оплата</div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid var(--line)', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 4 }}>180,000 <span style={{ fontSize: 16, color: 'var(--ink-3)' }}>сум</span></div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>Замораживается до подтверждения работы</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: 10, background: 'var(--bg)', borderRadius: 10, fontSize: 11, textAlign: 'center', border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 600 }}>UZCARD</div>
          <div style={{ flex: 1, padding: 10, background: 'var(--bg)', borderRadius: 10, fontSize: 11, textAlign: 'center' }}>HUMO</div>
          <div style={{ flex: 1, padding: 10, background: 'var(--bg)', borderRadius: 10, fontSize: 11, textAlign: 'center' }}>VISA</div>
        </div>
      </div>
      <div style={{ background: '#5fd17a22', color: '#2a8741', padding: 14, borderRadius: 14, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Check size={14}/> Защищено эскроу UzUsta
      </div>
    </div>
  );
}

Object.assign(window, { HowItWorks });
