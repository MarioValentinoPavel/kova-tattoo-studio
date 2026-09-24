(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  document.querySelectorAll('.js-year').forEach(el => (el.textContent = new Date().getFullYear()));

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = target => (lenis ? lenis.scrollTo(target, { duration: 1.6 }) : $(target)?.scrollIntoView({ behavior: 'smooth' }));
  $$('a[href^="#"]').forEach(a =>
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2 && id !== '#') return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      scrollTo(id === '#top' ? 0 : id);
    })
  );

  /* ---------- helpers: split text ---------- */
  const splitChars = el => {
    const txt = el.textContent;
    el.innerHTML = [...txt].map(c => `<span class="char">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    return $$('.char', el);
  };
  // envuelve cada palabra en una máscara (respeta <em> y <br>)
  const splitWordsMasked = el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
            const m = document.createElement('span');
            m.className = 'rl';
            m.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em';
            const i = document.createElement('span');
            i.style.display = 'inline-block';
            i.textContent = part;
            m.appendChild(i);
            frag.appendChild(m);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$('.rl > span', el);
  };
  const splitWords = el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$('.w', el);
  };

  const heroChars = $$('.hero__title .split').flatMap(splitChars);

  /* ---------- loader ---------- */
  const startSite = () => {
    document.body.classList.remove('is-loading');
    lenis && lenis.start();
    heroIntro();
    ScrollTrigger.refresh();
  };

  if (reduce) {
    $('.loader').remove();
    startSite();
  } else {
    const count = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => { $('.loader').remove(); startSite(); } });
    tl.to('.loader__leaf path', { strokeDashoffset: 0, duration: 1.6, stagger: 0.18, ease: 'power2.inOut' }, 0)
      .to('.loader__word span', { y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, 0.15)
      .to(count, { v: 100, duration: 2, ease: 'power2.inOut', onUpdate: () => ($('.js-count').textContent = Math.round(count.v)) }, 0)
      .to('.loader__word span', { y: '-110%', duration: 0.7, stagger: 0.05, ease: 'expo.in' }, 2.1)
      .to(['.loader__leaf', '.loader__count'], { opacity: 0, duration: 0.4 }, 2.1)
      .to('.loader__curtain', { scaleY: 1, duration: 0.8, ease: 'expo.inOut' }, 2.35)
      .set('.loader__curtain', { transformOrigin: 'top' })
      .set('.loader', { background: 'transparent' })
      .to('.loader__curtain', { scaleY: 0, duration: 0.9, ease: 'expo.inOut' });
  }

  function heroIntro() {
    if (reduce) return;
    gsap.timeline()
      .from('.hero__arch', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0)
      .from('.hero__video', { opacity: 0, duration: 1.2 }, 0.4)
      .from(heroChars, { yPercent: 110, rotate: 8, duration: 1.3, stagger: 0.07, ease: 'expo.out' }, 0.2)
      .from('.hero__meta span, .hero__scroll span', { y: 20, opacity: 0, duration: 1, stagger: 0.05, ease: 'power3.out' }, 0.6)
      .from('.badge-wrap', { scale: 0, opacity: 0, duration: 1.2, ease: 'back.out(1.6)' }, 0.8)
      .from('.nav', { opacity: 0, duration: 1, ease: 'expo.out' }, 0.5);
  }

  /* ---------- botones magnéticos ---------- */
  if (!isTouch) {
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,.4)' });
      el.addEventListener('mousemove', e => {
        const b = el.getBoundingClientRect();
        xTo((e.clientX - b.left - b.width / 2) * 0.35);
        yTo((e.clientY - b.top - b.height / 2) * 0.35);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- nav ---------- */
  const nav = $('.nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > 80);
      nav.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
      lastY = y;
    }
  });
  $('.nav__burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));

  if (reduce) {
    gsap.set('.reveal-up', { opacity: 1, y: 0 });
    return;
  }

  /* ---------- HERO: el arco se abre a pantalla completa ---------- */
  const heroTl = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 1 }
  });
  heroTl
    .to('.hero__arch', { width: '100vw', height: '100vh', borderRadius: 0, ease: 'power2.inOut', duration: 1 }, 0)
    .to('.hero__video', { scale: 1, ease: 'none', duration: 1 }, 0)
    .to('.hero__title--l', { xPercent: -60, opacity: 0, ease: 'power2.in', duration: 0.7 }, 0)
    .to('.hero__title--r', { xPercent: 60, opacity: 0, ease: 'power2.in', duration: 0.7 }, 0)
    .to(['.hero__meta', '.hero__scroll'], { opacity: 0, y: 30, duration: 0.3 }, 0)
    .to('.badge', { opacity: 0, duration: 0.3 }, 0)
    .to('.hero__shade', { opacity: 1, duration: 0.5 }, 0.5)
    .fromTo('.hero__reveal', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.4 }, 0.75)
    .to({}, { duration: 0.3 });

  /* ---------- marquee con velocidad según scroll ---------- */
  const mq = gsap.to('.marquee__track', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: '.marquee', start: 'top bottom', end: 'bottom top',
    onUpdate: self => {
      const v = self.getVelocity() / 300;
      gsap.to(mq, { timeScale: v === 0 ? 1 : Math.max(-6, Math.min(6, v)), duration: 0.2, overwrite: true });
      gsap.to(mq, { timeScale: self.direction === 1 ? 1 : -1, duration: 1, delay: 0.25 });
    }
  });

  /* ---------- reveal genéricos ---------- */
  $$('.reveal-up').forEach(el =>
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
  );
  $$('.reveal-lines').forEach(el => {
    const words = splitWordsMasked(el);
    gsap.from(words, { yPercent: 110, rotate: 4, duration: 1.2, stagger: 0.04, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ---------- manifiesto palabra a palabra ---------- */
  const words = splitWords($('.js-words'));
  gsap.to(words, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.intro__text', start: 'top 80%', end: 'bottom 45%', scrub: true }
  });

  /* ---------- contadores ---------- */
  $$('.js-num').forEach(el => {
    const to = +el.dataset.to, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => (el.textContent = (dec ? o.v.toFixed(dec).replace('.', ',') : String(Math.round(o.v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) + suf)
    });
  });

  /* ---------- imágenes con cortina + parallax ---------- */
  $$('.img-reveal').forEach(box => {
    const img = $('img', box);
    gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 85%' } })
      .to(box, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut' })
      .to(img, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.2);
  });
  $$('.parallax-img').forEach(img =>
    gsap.fromTo(img, { yPercent: -10 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
  );
  gsap.to('.studio__float--a', { y: -160, ease: 'none', scrollTrigger: { trigger: '.studio', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.studio__float--b', { y: -260, ease: 'none', scrollTrigger: { trigger: '.studio', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- galería horizontal ---------- */
  const track = $('.works__track');
  const dist = () => track.scrollWidth - innerWidth;
  const hTween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '.works', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
    }
  });
  gsap.to('.works__progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.works', start: 'top top', end: () => '+=' + dist(), scrub: true } });
  gsap.to('.works__head', { xPercent: -40, opacity: 0.08, ease: 'none', scrollTrigger: { trigger: '.works', start: 'top top', end: () => '+=' + dist() * 0.5, scrub: true } });
  $$('.work').forEach((w, i) => {
    const m = $('img, video', w);
    gsap.fromTo(m, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: w, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } });
    gsap.from(w, { y: i % 2 ? 120 : -60, rotate: i % 2 ? 3 : -3, ease: 'none', scrollTrigger: { trigger: w, containerAnimation: hTween, start: 'left right', end: 'center center', scrub: true } });
  });

  /* ---------- vídeos: reproducir solo en pantalla ---------- */
  $$('video').forEach(v => {
    ScrollTrigger.create({
      trigger: v.closest('section') || v, start: 'top bottom', end: 'bottom top',
      onToggle: s => (s.isActive ? v.play().catch(() => {}) : v.pause())
    });
  });

  /* ---------- servicios: imagen flotante que sigue al cursor ---------- */
  if (!isTouch) {
    const fl = $('.services__float'), flImg = $('img', fl);
    const p = { x: 0, y: 0 }, c = { x: 0, y: 0 };
    let active = false;
    addEventListener('mousemove', e => { p.x = e.clientX; p.y = e.clientY; });
    gsap.ticker.add(() => {
      const dx = p.x - c.x;
      c.x += dx * 0.12; c.y += (p.y - c.y) * 0.12;
      fl.style.left = c.x - 130 + 'px';
      fl.style.top = c.y - 170 + 'px';
      if (active) gsap.set(fl, { rotate: Math.max(-14, Math.min(14, dx * 0.08)) });
    });
    $$('.service').forEach(s => {
      s.addEventListener('mouseenter', () => {
        active = true;
        flImg.src = s.dataset.img;
        gsap.to(fl, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
        gsap.fromTo(flImg, { scale: 1.4 }, { scale: 1, duration: 0.9, ease: 'expo.out' });
      });
      s.addEventListener('mouseleave', () => {
        active = false;
        gsap.to(fl, { opacity: 0, scale: 0.6, duration: 0.5, ease: 'expo.out' });
      });
    });
  }
  gsap.from('.service', { y: 60, opacity: 0, stagger: 0.08, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.services__list', start: 'top 85%' } });

  /* ---------- CINE: ventana que crece a pantalla completa ---------- */
  const cineLetters = $$('.cine__word span');
  const cineTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.cine', start: 'top top', end: 'bottom bottom', scrub: 1,
      onUpdate: s => $('.cine').classList.toggle('is-open', s.progress > 0.45)
    }
  });
  cineTl
    .from(cineLetters, { yPercent: 120, opacity: 0, stagger: 0.05, duration: 0.3, ease: 'power3.out' }, 0)
    .from('.cine__kicker', { opacity: 0, y: 40, duration: 0.25 }, 0.1)
    .to('.cine__window', { width: '100vw', height: '100vh', borderRadius: 0, duration: 1, ease: 'power2.inOut' }, 0.35)
    .to('.cine__window video', { objectPosition: '50% 18%', duration: 1, ease: 'power2.inOut' }, 0.35)
    .to('.cine__word', { scale: 2.4, opacity: 0, duration: 0.8, ease: 'power2.in' }, 0.4)
    .to('.cine__kicker', { opacity: 0, y: -40, duration: 0.3 }, 0.6)
    .fromTo('.cine__caption', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 1.05)
    .to({}, { duration: 0.2 });

  /* ---------- instagram ---------- */
  gsap.from('.gram__item', {
    y: 120, opacity: 0, rotate: () => gsap.utils.random(-6, 6), scale: 0.9,
    stagger: { each: 0.06, from: 'random' }, duration: 1.3, ease: 'expo.out',
    scrollTrigger: { trigger: '.gram__grid', start: 'top 85%' }
  });
  $$('.gram__item').forEach((it, i) =>
    gsap.to($('img', it), { yPercent: i % 2 ? -6 : 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: it, start: 'top bottom', end: 'bottom top', scrub: true } })
  );
  // efecto tilt 3D
  if (!isTouch) $$('.gram__item, .work__img').forEach(el => {
    el.addEventListener('mousemove', e => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
      gsap.to(el, { rotateY: x * 10, rotateX: -y * 10, transformPerspective: 800, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1,.5)' }));
  });

  /* ---------- contacto ---------- */
  gsap.to('.contact__title .line > span', { y: 0, stagger: 0.12, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.contact__title', start: 'top 85%' } });

  /* ---------- footer ---------- */
  gsap.from('.footer__word span', {
    yPercent: 100, rotate: 10, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 }
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
