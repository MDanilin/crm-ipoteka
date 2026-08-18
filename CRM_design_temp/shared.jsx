// Shared utilities & components for UzUsta landing
const { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } = React;

// ——— Language hook ———
const LangContext = React.createContext({ lang: 'ru', t: window.UZU_I18N.ru, setLang: () => {} });

function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('uzu_lang') || 'ru');
  useEffect(() => { localStorage.setItem('uzu_lang', lang); document.documentElement.lang = lang; }, [lang]);
  const t = window.UZU_I18N[lang];
  return <LangContext.Provider value={{ lang, t, setLang }}>{children}</LangContext.Provider>;
}
function useLang() { return React.useContext(LangContext); }

// ——— Reveal-on-scroll hook ———
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { el.classList.add('is-in'); io.unobserve(el); }
      });
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

// ——— Magnetic button wrapper ———
function Magnetic({ children, strength = 0.3 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = null;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = 'translate(0,0)';
      el.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
      setTimeout(() => { if (el) el.style.transition = ''; }, 600);
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return <span ref={ref} className="magnetic">{children}</span>;
}

// ——— Custom cursor ———
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const wrapRef = useRef(null);
  useEffect(() => {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf;
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate(${mx}px, ${my}px)`;
      const t = e.target;
      const hover = t && (t.closest('a, button, [data-cursor="hover"]'));
      if (wrapRef.current) wrapRef.current.classList.toggle('is-hovering', !!hover);
    };
    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ringRef.current) ringRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="uzu-cursor" ref={wrapRef}>
      <div className="uzu-cursor__dot" ref={dotRef}>
        <div style={{ position: 'absolute', inset: 0, transform: 'translate(-50%,-50%)' }}>
          <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }}></div>
        </div>
      </div>
      <div className="uzu-cursor__ring" ref={ringRef}></div>
    </div>
  );
}

// ——— Small inline icons ———
const Arrow = ({ size = 18 }) => (
  <svg className="btn-arrow" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const Check = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const Spark = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z"/>
  </svg>
);

// expose globally
Object.assign(window, { LangProvider, useLang, useReveal, Magnetic, CustomCursor, Arrow, Check, Spark });
