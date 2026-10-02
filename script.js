/* IN-FORMA SENAI — apenas comportamento. Todo o conteúdo já existe no HTML. */
(function () {
  'use strict';

  /* 1. Data atual (pt-BR) */
  const now = new Date();
  const month = now.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  document.querySelectorAll('[data-date-long]').forEach(function (el) { el.textContent = now.getDate() + ' DE ' + month + ', ' + now.getFullYear(); });
  document.querySelectorAll('[data-date-short]').forEach(function (el) { el.textContent = now.toLocaleDateString('pt-BR'); });

  /* 2. Menu hambúrguer */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    const setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      nav.hidden = !open;
    };
    setOpen(false);
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
  }

  /* 3. Carrossel reutilizável: move os itens que já existem no HTML */
  function Carousel(root) {
    const viewport = root.querySelector('.carousel-viewport');
    const track = root.querySelector('.carousel-track');
    const items = Array.from(track.children);
    const dotsBox = root.querySelector('.carousel-dots');
    const fixed = parseInt(root.dataset.perView, 10);
    const delay = parseInt(root.dataset.autoplay, 10) || 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let perView = 1, page = 0, timer = null, auto = delay > 0;

    const calcPerView = function () {
      if (fixed) return fixed;
      return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    };
    const pages = function () { return Math.ceil(items.length / perView); };

    function buildDots() { // só os botões de indicador; a quantidade depende do viewport
      dotsBox.innerHTML = '';
      for (let i = 0; i < pages(); i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ir para o grupo ' + (i + 1));
        b.addEventListener('click', function () { goTo(i); userStop(); });
        dotsBox.appendChild(b);
      }
    }
    function render() {
      const idx = Math.max(Math.min(page * perView, items.length - perView), 0);
      track.style.transform = 'translateX(' + -items[idx].offsetLeft + 'px)';
      items.forEach(function (it, i) {
        const visible = i >= idx && i < idx + perView;
        it.setAttribute('aria-hidden', String(!visible));
        it.querySelectorAll('a,button').forEach(function (c) { c.tabIndex = visible ? 0 : -1; });
      });
      Array.from(dotsBox.children).forEach(function (d, i) { d.setAttribute('aria-current', String(i === page)); });
    }
    function goTo(n) { const t = pages(); page = (n + t) % t; render(); }
    function setup() {
      perView = calcPerView();
      root.style.setProperty('--per-view', perView);
      page = Math.min(page, pages() - 1);
      buildDots(); render();
    }
    function play() { if (auto && !reduce && !timer) timer = setInterval(function () { goTo(page + 1); }, delay); }
    function pause() { clearInterval(timer); timer = null; }
    function userStop() { pause(); auto = false; }

    root.querySelector('.carousel-prev').addEventListener('click', function () { goTo(page - 1); userStop(); });
    root.querySelector('.carousel-next').addEventListener('click', function () { goTo(page + 1); userStop(); });
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', play);

    let startX = null; // deslizar com o dedo
    viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; pause(); }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { goTo(page + (dx < 0 ? 1 : -1)); userStop(); }
      startX = null;
    });

    window.addEventListener('resize', setup);
    setup(); play();
  }
  document.querySelectorAll('[data-carousel]').forEach(Carousel);

  /* 4. Agenda -> Google Calendar, a partir de data-title e data-time */
  const p2 = function (n) { return String(n).padStart(2, '0'); };
  const fmt = function (d) {
    return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + 'T' + p2(d.getHours()) + p2(d.getMinutes()) + '00';
  };
  document.querySelectorAll('.agenda-event').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const start = new Date(btn.dataset.time);
      if (isNaN(start)) return;
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // duração padrão de 2h
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: btn.dataset.title,
        dates: fmt(start) + '/' + fmt(end),
        ctz: 'America/Sao_Paulo',
        details: 'Evento divulgado pelo In-Forma SENAI.'
      });
      window.open('https://calendar.google.com/calendar/render?' + params.toString(), '_blank', 'noopener');
    });
  });
})();