import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

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
}

const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

// The header slides away while scrolling down and comes back while scrolling up. It stays visible near the top,
// while the menu is open, and while something inside has focus.
// "Floating" (is-compact: no logo, centered nav bar, shadow) starts when the page is scrolled UP, never on the way
// down, and ends when the page is back at the top.
export default function SiteHeader({ items, logo, labels }: Props) {
  const headerRef = useRef<HTMLElement>(null);
  const navBarRef = useRef<HTMLElement>(null);
  const logoAreaRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const navItemsRef = useRef<HTMLUListElement>(null);
  const underlineRef = useRef<HTMLLIElement>(null);

  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [inPanel, setInPanel] = useState(false); // false = all items in the bar (also the no-JS / server state)
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  // Language switch (placeholder): a click swaps the current language and the other one (no navigation yet).
  const [lang, setLang] = useState<'jp' | 'en'>('jp');
  const other = lang === 'jp' ? 'en' : 'jp';

  // Mirrors of the state for the scroll / document listeners, which must see changes synchronously.
  const compactRef = useRef(false);
  const menuOpenRef = useRef(false);
  const closingRef = useRef(false);
  const lastY = useRef(0);
  const navLeftBefore = useRef<number | undefined>(undefined);
  const logoFadeIn = useRef(false);

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

  // Switch floating on/off. Moving the nav bar between the right edge and the center cannot be a CSS transition (it
  // is a layout change), so it is animated by hand: measure where the bar was, switch, then slide it from the old
  // position to its new one (see the layout effect below). The logo fades in when it comes back.
  const setFloating = (on: boolean) => {
    if (on && !isDesktop()) return; // no floating nav on mobile
    if (compactRef.current === on) return;
    navLeftBefore.current = navBarRef.current?.getBoundingClientRect().left;
    logoFadeIn.current = !on;
    compactRef.current = on;
    setCompact(on);
  };

  useLayoutEffect(() => {
    const navBar = navBarRef.current;
    const before = navLeftBefore.current;
    navLeftBefore.current = undefined;
    if (reducedMotion() || !navBar || before === undefined) return;
    const dx = before - navBar.getBoundingClientRect().left;
    if (Math.abs(dx) > 1) {
      navBar.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 350, easing: EASE });
    }
    const logoArea = logoAreaRef.current;
    if (logoFadeIn.current && logoArea) {
      logoArea.animate([{ opacity: 0 }, { opacity: logoArea.style.opacity || 1 }], { duration: 350, easing: 'ease' });
    }
  }, [compact]);

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
    const logoArea = logoAreaRef.current;
    const menus = [...header.querySelectorAll<HTMLElement>('.nav-bar, .mobile-menu')];
    lastY.current = window.scrollY;

    const update = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY.current;
      const fade = Math.max(0, 1 - y / 40);
      logoArea?.style.setProperty('opacity', String(fade));
      logoArea?.style.setProperty('pointer-events', fade === 0 ? 'none' : '');
      if (Math.abs(delta) >= 4) {
        const pinned = y < 80 || header.querySelector('details[open]') || header.matches(':focus-within');
        setHidden(delta > 0 && !pinned);
        if (delta < 0 && y > 16) setFloating(true);
        lastY.current = y;
      }
      if (y <= 16) setFloating(false);
      // Menu fades with the logo, except while floating (it is the only thing shown then).
      const menuFade = compactRef.current || menuOpenRef.current ? 1 : fade;
      menus.forEach((m) => m.style.setProperty('opacity', String(menuFade)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });

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
      } else {
        setFloating(false);
      }
    });
    ro.observe(header);

    return () => {
      window.removeEventListener('scroll', update);
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

  // Keep the menu items' opacity in step when the menu opens or the nav bar moves (floating on/off).
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const fade = Number(logoAreaRef.current?.style.opacity || 1);
    header.querySelectorAll<HTMLElement>('.nav-bar, .mobile-menu').forEach((m) => {
      m.style.setProperty('opacity', String(compact || menuOpen ? 1 : fade));
    });
  }, [compact, menuOpen]);

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

  const cls = ['site-header', hidden && 'is-hidden', compact && 'is-compact'].filter(Boolean).join(' ');

  return (
    <header className={cls} ref={headerRef} onFocus={() => setHidden(false)}>
      <div className="container-cc header-inner">
        <div className="logo-area" ref={logoAreaRef}>
          <a href="/" className="logo-link" aria-label={labels.site}>
            {logo}
          </a>
          {/* Language switch: shows the current language (data-lang) and, on hover, the one it would switch to
              (data-other). The labels are drawn by CSS. For now a click only swaps the two; it does not navigate yet. */}
          <button
            type="button"
            className="lang-toggle"
            data-lang={lang}
            data-other={other}
            aria-label={other === 'en' ? labels.en : labels.ja}
            onClick={() => setLang(other)}
          />
        </div>

        <nav className="nav-bar" aria-label={labels.nav} ref={navBarRef}>
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
