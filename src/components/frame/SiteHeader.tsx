import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export interface NavItem {
  text: string;
  href: string;
  btn?: string;
  current: boolean;
}

interface Props {
  items: NavItem[];
  logo?: ReactNode; // the <LogoBlock slot="logo" /> passed by 01_header.astro
  labels: { site: string; nav: string; menu: string; ja: string; en: string };
  lang: 'ja' | 'en'; // language of the page
  home: string; // the logo's link: the top page in this language
  switchHref: string; // the same page in the other language
}

// A plain fixed header: always visible, the same at every scroll position.
export default function SiteHeader({ items, logo, labels, lang: pageLang, home, switchHref }: Props) {
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const navItemsRef = useRef<HTMLUListElement>(null);
  const underlineRef = useRef<HTMLLIElement>(null);

  const [inPanel, setInPanel] = useState(false); // false = all items in the bar (also the no-JS / server state)
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  // Language switch: a link to the same page in the other language. The button shows the labels 'jp' / 'en'.
  const lang = pageLang === 'ja' ? 'jp' : 'en';
  const other = lang === 'jp' ? 'en' : 'jp';

  // Mirrors of the state for the document listener, which must see changes synchronously.
  const menuOpenRef = useRef(false);
  const closingRef = useRef(false);

  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The breakpoint lives in CSS only (--bp-md); style.css exposes it here as --is-mobile on the header.
  const isDesktop = () => {
    const header = headerRef.current;
    return !header || getComputedStyle(header).getPropertyValue('--is-mobile').trim() === '0';
  };

  const openMenu = (open: boolean) => {
    menuOpenRef.current = open;
    setMenuOpen(open);
  };

  // Closing slides the panel out first; <details> would otherwise hide it at once.
  const toggleMenu = useCallback(() => {
    if (!menuOpenRef.current) return openMenu(true);
    if (closingRef.current) return;
    if (reducedMotion()) return openMenu(false);
    closingRef.current = true;
    setClosing(true);
  }, []);

  const onPanelAnimationEnd = (e: React.AnimationEvent) => {
    if (!closingRef.current || e.target !== e.currentTarget) return;
    closingRef.current = false;
    setClosing(false);
    openMenu(false);
  };

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    // A click or tap outside the open panel closes it.
    const onDocClick = (e: MouseEvent) => {
      if (!menuOpenRef.current || closingRef.current) return;
      if (e.target instanceof Node && !menuRef.current?.contains(e.target)) toggleMenu();
    };
    document.addEventListener('click', onDocClick);

    // Desktop (--bp-md and up): every item stays in the bar. Mobile: every item lives in the hamburger panel.
    let wasDesktop = isDesktop();
    setInPanel(!wasDesktop);
    const ro = new ResizeObserver(() => {
      if (isDesktop() === wasDesktop) return;
      wasDesktop = isDesktop();
      setInPanel(!wasDesktop);
      if (wasDesktop) {
        closingRef.current = false;
        setClosing(false);
        openMenu(false);
      }
    });
    ro.observe(header);

    return () => {
      document.removeEventListener('click', onDocClick);
      ro.disconnect();
    };
  }, []);

  // The underline of the bar: it sits under the current page's item and slides to the item that is hovered (or has
  // focus); when the pointer leaves, it slides back. It spans the straight part of the pill's bottom edge (the pill is
  // fully round, so each end curve is 1.5rem wide). Positions are measured relative to the list, so the bar moving
  // (floating on/off) does not matter.
  useEffect(() => {
    const ul = navItemsRef.current;
    const underline = underlineRef.current;
    if (inPanel || !ul || !underline) return;
    // The only animation here is the slide, started explicitly (Web Animations) by a hover, a focus, or the pointer
    // leaving. Every other placement (the first one, a re-measure after a resize / fonts loaded / the bar moving) just
    // sets the final position, so nothing can slide in on page load. A slide starts from where the underline's last
    // item is measured *now*, never from an earlier measurement: that one may predate the final layout (a hover can
    // arrive right at load, while the pointer still rests on the item that was clicked).
    const inset = () => 1.5 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const measure = (a: HTMLElement) => {
      const r = a.getBoundingClientRect();
      const u = ul.getBoundingClientRect();
      return {
        x: r.left - u.left + inset(),
        y: r.bottom - u.top - underline.offsetHeight,
        w: Math.max(0, r.width - 2 * inset()),
      };
    };
    const frame = (m: { x: number; y: number; w: number }) => ({ width: `${m.w}px`, transform: `translate(${m.x}px, ${m.y}px)` });
    let lastAnchor: HTMLElement | null = null;
    const place = (a: HTMLElement | null, hovering: boolean, slide: boolean) => {
      underline.getAnimations().forEach((anim) => anim.cancel());
      if (!a) {
        underline.style.opacity = '0';
        lastAnchor = null;
        return;
      }
      const from = lastAnchor ? measure(lastAnchor) : undefined;
      const next = measure(a);
      lastAnchor = a;
      Object.assign(underline.style, frame(next));
      underline.style.opacity = hovering ? '0.5' : '1';
      const moved = from && (Math.abs(from.x - next.x) > 1 || Math.abs(from.y - next.y) > 1 || Math.abs(from.w - next.w) > 1);
      if (slide && moved && !reducedMotion()) {
        underline.animate([frame(from), frame(next)], { duration: 250, easing: 'ease' });
      }
    };
    const current = () => ul.querySelector<HTMLElement>('a[aria-current="page"]');
    const rest = () => place(current(), false, false);
    const slideBack = () => place(current(), false, true);
    const onOver = (e: Event) => {
      const a = (e.target as HTMLElement).closest('a');
      if (!a || !ul.contains(a)) return;
      place(a, true, true);
    };
    ul.addEventListener('mouseover', onOver);
    ul.addEventListener('focusin', onOver);
    ul.addEventListener('mouseleave', slideBack);
    ul.addEventListener('focusout', slideBack);
    const ro = new ResizeObserver(rest);
    ro.observe(ul);
    document.fonts?.ready.then(rest);
    rest();
    return () => {
      ul.removeEventListener('mouseover', onOver);
      ul.removeEventListener('focusin', onOver);
      ul.removeEventListener('mouseleave', slideBack);
      ul.removeEventListener('focusout', slideBack);
      ro.disconnect();
    };
  }, [inPanel]);

  const links = (panel: boolean) =>
    items.map((i) => (
      <li className={['nav-item', i.btn && 'nav-item-action'].filter(Boolean).join(' ')} data-btn={i.btn} key={i.href}>
        <a
          href={i.href}
          className={panel ? undefined : i.btn}
          aria-current={!i.btn && i.current ? 'page' : undefined}
        >
          {i.text}
        </a>
      </li>
    ));

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container-cc header-inner">
        <div className="logo-area">
          <a href={home} className="logo-link" aria-label={labels.site}>
            {logo}
          </a>
          {/* Language switch: shows the current language (data-lang) and, on hover, the one it would switch to
              (data-other). The labels are drawn by CSS. */}
          <a
            href={switchHref}
            hrefLang={pageLang === 'ja' ? 'en' : 'ja'}
            className="lang-toggle"
            data-lang={lang}
            data-other={other}
            aria-label={other === 'en' ? labels.en : labels.ja}
          />
        </div>

        <nav className="nav-bar" aria-label={labels.nav}>
          <ul className="nav-items" ref={navItemsRef}>
            {inPanel ? null : links(false)}
            {!inPanel && <li className="nav-underline" ref={underlineRef} aria-hidden="true" />}
          </ul>
        </nav>

        <details
          className={['mobile-menu', closing && 'is-closing'].filter(Boolean).join(' ')}
          ref={menuRef}
          hidden={!inPanel}
          open={menuOpen}
        >
          <summary
            aria-label={labels.menu}
            onClick={(e) => {
              e.preventDefault();
              toggleMenu();
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path className="icon-open" d="M4 7h16M4 12h16M4 17h16" />
              <path className="icon-close" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </summary>
          <nav className="mobile-menu-panel" aria-label={labels.nav} onAnimationEnd={onPanelAnimationEnd}>
            <ul>{inPanel ? links(true) : null}</ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
