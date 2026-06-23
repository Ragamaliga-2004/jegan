/* =========================================================
   JAGAN — Premium Birthday Experience
   Shared interaction engine
   ========================================================= */

/* ---------- page entrance ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
  initRevealOnScroll();
  initPageTransitions();
  initParticleField();
  initCountdownIfPresent();
});

/* ---------- scroll reveal ---------- */
function initRevealOnScroll(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
}

/* ---------- smooth page transitions between real pages ---------- */
function initPageTransitions(){
  const veil = document.createElement('div');
  veil.className = 'page-veil';
  veil.innerHTML = '<div class="veil-mark">✦</div>';
  document.body.appendChild(veil);

  document.querySelectorAll('a[data-transition]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if(!href || href.startsWith('#')) return;
      e.preventDefault();
      veil.classList.add('active');
      setTimeout(() => { window.location.href = href; }, 480);
    });
  });

  // fade veil out on load (covers back-navigation too)
  veil.classList.add('active');
  requestAnimationFrame(() => {
    setTimeout(() => veil.classList.remove('active'), 60);
  });
}

/* ---------- ambient gold particle field (sparkles + drifting confetti flecks) ---------- */
function initParticleField(){
  const canvas = document.getElementById('fxCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, particles;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const density = window.innerWidth < 600 ? 16 : 30;

  function makeParticle(){
    const isFleck = Math.random() < 0.35;
    return {
      x: Math.random()*w,
      y: Math.random()*h,
      r: isFleck ? (2 + Math.random()*2.5) : (0.6 + Math.random()*1.3),
      speedY: 0.15 + Math.random()*0.35,
      speedX: (Math.random()-0.5)*0.25,
      alpha: 0.25 + Math.random()*0.5,
      flicker: Math.random()*Math.PI*2,
      isFleck,
      hue: Math.random() < 0.5 ? '212,175,55' : '244,228,188',
      rot: Math.random()*Math.PI*2,
      rotSpeed: (Math.random()-0.5)*0.02
    };
  }
  particles = reduceMotion ? [] : Array.from({length: density}, makeParticle);

  function tick(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(p => {
      p.y -= p.speedY;
      p.x += p.speedX + Math.sin(p.flicker)*0.15;
      p.flicker += 0.015;
      p.rot += p.rotSpeed;
      if(p.y < -10){ p.y = h+10; p.x = Math.random()*w; }
      if(p.x < -10) p.x = w+10;
      if(p.x > w+10) p.x = -10;

      const alpha = p.alpha * (0.6 + 0.4*Math.sin(p.flicker*2));

      if(p.isFleck){
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(${p.hue},${alpha})`;
        ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r*0.4);
        ctx.restore();
      } else {
        const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*5);
        grad.addColorStop(0, `rgba(${p.hue},${alpha})`);
        grad.addColorStop(1, `rgba(${p.hue},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r*5,0,Math.PI*2);
        ctx.fill();
      }
    });
    if(!reduceMotion) requestAnimationFrame(tick);
  }
  if(!reduceMotion) requestAnimationFrame(tick);
}

/* ---------- confetti burst (call on demand: confettiBurst(x,y)) ---------- */
function confettiBurst(originX, originY, opts={}){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = reduceMotion ? 0 : (opts.count || 60);
  const colors = opts.colors || ['#d4af37','#f4e4bc','#c9622e','#ece0c8','#9c7a2e'];

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 300;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ox = originX ?? canvas.width/2;
  const oy = originY ?? canvas.height/2;

  const pieces = Array.from({length: count}, () => ({
    x: ox, y: oy,
    vx: (Math.random()-0.5)*14,
    vy: -(Math.random()*14 + 4),
    g: 0.35 + Math.random()*0.15,
    size: 5 + Math.random()*7,
    color: colors[Math.floor(Math.random()*colors.length)],
    rot: Math.random()*Math.PI*2,
    rotSpeed: (Math.random()-0.5)*0.3,
    life: 1
  }));

  let frame = 0;
  function tick(){
    frame++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive = false;
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx *= 0.99;
      p.rot += p.rotSpeed;
      p.life -= 0.008;
      if(p.life > 0){
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/3, p.size, p.size*0.66);
        ctx.restore();
      }
    });
    if(alive && frame < 240){
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  if(!reduceMotion) requestAnimationFrame(tick);
}

/* ---------- live countdown (used on index + any page with #cd-days etc) ---------- */
function initCountdownIfPresent(){
  const daysEl = document.getElementById('cd-days');
  if(!daysEl) return;

  function pad(n){ return String(n).padStart(2,'0'); }
  function update(){
    const target = new Date('2026-06-24T00:00:00');
    const now = new Date();
    const diff = target - now;
    const grid = document.getElementById('countdownGrid');
    const arrived = document.getElementById('countdownArrived');
    if(diff <= 0){
      if(grid) grid.style.display = 'none';
      if(arrived) arrived.style.display = 'block';
      return;
    }
    const days = Math.floor(diff/(1000*60*60*24));
    const hours = Math.floor((diff/(1000*60*60))%24);
    const mins = Math.floor((diff/(1000*60))%60);
    const secs = Math.floor((diff/1000)%60);
    document.getElementById('cd-days').textContent = pad(days);
    document.getElementById('cd-hours').textContent = pad(hours);
    document.getElementById('cd-mins').textContent = pad(mins);
    document.getElementById('cd-secs').textContent = pad(secs);
  }
  update();
  setInterval(update, 1000);
}

/* ---------- typing effect helper ---------- */
function typeText(el, text, speed=32){
  if(!el) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion){ el.textContent = text; return; }
  el.textContent = '';
  let i = 0;
  function step(){
    if(i <= text.length){
      el.textContent = text.slice(0, i);
      i++;
      setTimeout(step, speed);
    }
  }
  step();
}
