/* Sr. Canalla — comportamiento común (home y marketplace) */
(function () {
  var anio = document.querySelector('.js-anio');
  if (anio) anio.textContent = new Date().getFullYear();

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
