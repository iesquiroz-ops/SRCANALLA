/* Sr. Canalla — comportamiento común (home y marketplace) */
(function () {
  var anio = document.querySelector('.js-anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* Correo de contacto: se monta al cargar para que no aparezca en claro en el HTML (antispam) */
  document.querySelectorAll('.js-mail').forEach(function (a) {
    var m = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
    a.href = 'mailto:' + m;
    if (a.hasAttribute('data-ver')) a.textContent = m;
  });

  /* Aviso flotante */
  var toast = document.querySelector('.toast'), t;
  function avisar(msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('on');
    clearTimeout(t); t = setTimeout(function () { toast.classList.remove('on'); }, 2600);
  }

  /* Bolsa simulada: se guarda en el navegador del visitante (sin pasarela de pago) */
  var CLAVE = 'srcanalla_bolsa';
  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { return memoria; }
  }
  var memoria = [];
  function guardar(items) {
    memoria = items;
    try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch (e) {}
    pintar();
  }
  function contar() {
    return leer().reduce(function (n, i) { return n + i.cantidad; }, 0);
  }
  function total() {
    return leer().reduce(function (s, i) { return s + i.cantidad * i.precio; }, 0);
  }
  function pintar() {
    var n = contar();
    document.querySelectorAll('.js-bolsa-n').forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
    document.querySelectorAll('.js-bolsa').forEach(function (b) { b.setAttribute('aria-label', 'Bolsa, ' + n + (n === 1 ? ' artículo' : ' artículos')); });
  }
  function anadir(item) {
    var items = leer(), clave = [item.coleccion, item.producto, item.color, item.talla].join('|');
    var ya = items.filter(function (i) { return [i.coleccion, i.producto, i.color, i.talla].join('|') === clave; })[0];
    if (ya) ya.cantidad += item.cantidad; else items.push(item);
    guardar(items);
  }
  var euros = function (v) { return v.toFixed(2).replace('.', ',') + ' €'; };

  document.querySelectorAll('.js-bolsa').forEach(function (b) {
    b.addEventListener('click', function () {
      var n = contar();
      avisar(n ? 'Tu bolsa: ' + n + (n === 1 ? ' artículo' : ' artículos') + ' · ' + euros(total()) : 'Tu bolsa está vacía');
    });
  });
  pintar();

  window.SrCanalla = { avisar: avisar, bolsa: { anadir: anadir, contar: contar }, euros: euros };
})();

/* Sonora Canalla: jukebox. Solo suena lo que elige el visitante; al acabar, se para. */
(function () {
  var panel = document.querySelector('.js-sonora');
  if (!panel) return;
  var audio = panel.querySelector('.js-sc-audio');
  var filas = [].slice.call(panel.querySelectorAll('.js-sc-fila'));
  var pp = panel.querySelector('.js-sc-pp');
  var barra = panel.querySelector('.js-sc-barra');
  var actual = -1, arrastrando = false;

  function icono(el, nombre) { var u = el.querySelector('use'); if (u) u.setAttribute('href', '#ico-' + nombre); }
  function pintar() {
    var suena = actual > -1 && !audio.paused;
    filas.forEach(function (f, i) {
      var esta = i === actual;
      f.classList.toggle('on', esta);
      f.setAttribute('aria-pressed', esta && suena ? 'true' : 'false');
      icono(f, esta && suena ? 'pausa' : 'play');
    });
    icono(pp, suena ? 'pausa' : 'play');
    pp.setAttribute('aria-label', suena ? 'Pausar' : 'Reproducir');
    barra.disabled = actual < 0;
  }
  function posicion(v) { barra.value = v; barra.style.setProperty('--p', (v / 10) + '%'); }
  function parar() { actual = -1; audio.pause(); audio.removeAttribute('src'); audio.load(); posicion(0); pintar(); }
  function tocar(i) {
    if (i === actual) { if (audio.paused) audio.play().catch(fallo); else audio.pause(); return; }
    actual = i; posicion(0);
    audio.src = filas[i].getAttribute('data-src');
    audio.play().catch(fallo);
    pintar();
  }
  function fallo(e) {
    if (e && e.name === 'AbortError') return;
    parar();
    if (window.SrCanalla) SrCanalla.avisar('Esta canción aún no está disponible');
  }

  filas.forEach(function (f, i) { f.addEventListener('click', function () { tocar(i); }); });
  pp.addEventListener('click', function () { tocar(actual < 0 ? 0 : actual); });
  panel.querySelector('.js-sc-ant').addEventListener('click', function () { tocar(actual <= 0 ? filas.length - 1 : actual - 1); });
  panel.querySelector('.js-sc-sig').addEventListener('click', function () { tocar(actual < 0 || actual === filas.length - 1 ? 0 : actual + 1); });

  audio.addEventListener('play', pintar);
  audio.addEventListener('pause', pintar);
  audio.addEventListener('ended', parar);
  audio.addEventListener('error', function () { if (actual > -1 && audio.getAttribute('src')) fallo(); });
  audio.addEventListener('timeupdate', function () {
    if (!arrastrando && audio.duration) posicion(Math.round(audio.currentTime / audio.duration * 1000));
  });
  barra.addEventListener('input', function () { arrastrando = true; posicion(barra.value); });
  barra.addEventListener('change', function () {
    arrastrando = false;
    if (audio.duration) audio.currentTime = barra.value / 1000 * audio.duration;
  });
})();
