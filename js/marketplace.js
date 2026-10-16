/* Sr. Canalla — marketplace
   URL: coleccion.html?c=<coleccion>[&p=<producto>][&color=<color>]
   Datos: js/catalogo.js (generado desde datos/*.csv)
   Imágenes por convención: img/marketplace/<c>/<c>_<producto>_<color>_<01|02|03>.webp */
(function () {
  var CAT = window.SRC_CATALOGO || { colecciones: [], productos: [] };
  var SC = window.SrCanalla;
  var $ = function (s) { return document.querySelector(s); };
  var VISTAS = ['01', '02', '03'];
  var NOMBRE_VISTA = { '01': 'vista frontal', '02': 'detalle del estampado', '03': 'vista alternativa' };

  var q = new URLSearchParams(location.search);
  var col = CAT.colecciones.filter(function (c) { return c.slug === q.get('c'); })[0];
  if (!col) { location.replace('index.html#colecciones'); return; }

  var productos = CAT.productos.filter(function (p) { return p.coleccion === col.slug; })
    .sort(function (a, b) { return a.orden - b.orden; });

  /* Portada de la colección */
  $('.js-col-titulo').src = col.titulo; $('.js-col-titulo').alt = col.nombre;
  $('.js-col-ilus').src = col.ilustracion; $('.js-col-ilus').alt = 'Ilustración de la colección ' + col.nombre;
  document.querySelectorAll('.js-col-eyebrow').forEach(function (e) { e.textContent = 'Colección ' + col.nombre; });
  document.title = col.nombre + ' · Sr. Canalla';

  if (!productos.length) {
    $('.js-ficha').hidden = true; $('.js-mas-col').hidden = true; $('.js-vacia').hidden = false;
    return;
  }

  var estado = { p: null, color: null, talla: null, vista: '01', cant: 1, inicio: 0 };

  /* La Catrina: en la vista 02 de las prendas va la trabilla SRCNLL del tejido/color (la taza queda fuera).
     Archivo: img/marketplace/la-catrina/trabilla-srcnll_<tejido>-<color>.webp ; "unico" se toma como negro. */
  var TRABILLA = { 'la-catrina': { camiseta1: 'jersey', camiseta2: 'jersey', sudadera: 'sudadera', chaleco: 'denim', bandana: 'bandana' } };
  function trabilla(p) { return (TRABILLA[p.coleccion] || {})[p.producto]; }
  function ruta(p, color, vista) {
    var t = vista === '02' && trabilla(p);
    if (t) return 'img/marketplace/' + p.coleccion + '/trabilla-srcnll_' + t + '-' + (color === 'unico' ? 'negro' : color) + '.webp';
    return 'img/marketplace/' + p.coleccion + '/' + p.coleccion + '_' + p.producto + '_' + color + '_' + vista + '.webp';
  }
  function precarga(src) { var i = new Image(); i.src = src; }
  function boton(cls, attrs, html) {
    var b = document.createElement('button'); b.type = 'button'; b.className = cls;
    Object.keys(attrs).forEach(function (k) { b.setAttribute(k, attrs[k]); });
    if (html) b.innerHTML = html; return b;
  }
  function nombreVista(v) {
    if (estado.p && estado.p.coleccion === 'la-catrina' && estado.p.producto === 'bandana') {
      return { '01': 'pañuelo cuadrado abierto', '02': 'detalle de la trabilla SRCNLL', '03': 'pañuelo colocado en el cuello de una modelo' }[v];
    }
    if (v === '02' && estado.p && trabilla(estado.p)) return 'detalle de la trabilla SRCNLL';
    return NOMBRE_VISTA[v];
  }
  // Vistas del producto: 3 por defecto; la columna "vistas" del CSV puede dejarlo en 1 o 2
  function vistasDe(p) { return VISTAS.slice(0, p.vistas || 3); }
  // "piel-negra" → "piel negra" (lo que lee el cliente)
  var TILDES = { marron: 'marrón' };
  function nombreColor(c) { return String(c).split('-').map(function (w) { return TILDES[w] || w; }).join(' '); }
  /* La vista 02 suele ser un primer plano a sangre (cubre todo el hueco). Si la imagen trae fondo
     transparente (producto recortado, p. ej. gafas o bolsa), se muestra entera y con sombra. */
  function esOpaca(img) {
    try {
      var c = document.createElement('canvas'); c.width = c.height = 1;
      var x = c.getContext('2d'), w = img.naturalWidth, h = img.naturalHeight;
      return [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].every(function (e) {
        x.clearRect(0, 0, 1, 1); x.drawImage(img, e[0], e[1], 1, 1, 0, 0, 1, 1);
        return x.getImageData(0, 0, 1, 1).data[3] > 250;
      });
    } catch (err) { return true; }   // si el navegador no deja leerla (abierta como archivo local), como antes
  }
  function claseImg(img, vista, opaca) {
    var cubre = vista === '02' && opaca !== false;
    img.classList.toggle('cubre', cubre);
    img.classList.toggle('sombra', !cubre);
  }

  /* ---------- Ficha ---------- */
  function elegir(p, opciones) {
    opciones = opciones || {};
    estado.p = p;
    estado.color = p.colores.indexOf(opciones.color) >= 0 ? opciones.color : p.colores[0];
    estado.talla = p.tallas.length ? (p.tallas.indexOf('M') >= 0 ? 'M' : p.tallas[0]) : null;
    estado.vista = '01'; estado.cant = 1;

    $('.js-nombre').textContent = p.nombre;
    $('.js-precio').textContent = SC.euros(p.precio);
    $('.js-claim').textContent = p.claim;
    $('.js-mat').textContent = p.materiales;
    $('.js-cant').textContent = 1;
    document.title = p.nombre + ' · Sr. Canalla';

    // Color (solo si hay más de uno)
    var cajaC = $('.js-colores'); cajaC.innerHTML = '';
    $('.js-op-color').hidden = p.colores.length < 2;
    p.colores.forEach(function (c) {
      var b = boton('mk-swatch mk-swatch--' + c, { role: 'radio', 'aria-label': nombreColor(c), 'aria-checked': c === estado.color, 'data-color': c });
      b.addEventListener('click', function () { cambiarColor(c); });
      cajaC.appendChild(b);
    });

    // Tallas (solo prendas)
    var cajaT = $('.js-tallas'); cajaT.innerHTML = '';
    $('.js-op-talla').hidden = !p.tallas.length;
    p.tallas.forEach(function (t) {
      var b = boton('mk-talla', { role: 'radio', 'aria-checked': t === estado.talla }, t);
      b.addEventListener('click', function () {
        estado.talla = t;
        cajaT.querySelectorAll('.mk-talla').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
      });
      cajaT.appendChild(b);
    });

    pintarGaleria();
    pintarCarrusel();
    actualizarURL();
  }

  function cambiarColor(c) {
    estado.color = c;
    $('.js-color-nombre').textContent = nombreColor(c);
    document.querySelectorAll('.mk-swatch').forEach(function (s) { s.setAttribute('aria-checked', s.getAttribute('data-color') === c); });
    pintarGaleria();
    actualizarURL();
  }

  function pintarGaleria() {
    var p = estado.p;
    $('.js-color-nombre').textContent = nombreColor(estado.color);
    var minis = $('.js-minis'); minis.innerHTML = '';
    var vistas = vistasDe(p);
    if (vistas.indexOf(estado.vista) < 0) estado.vista = '01';
    minis.hidden = vistas.length < 2;   // con una sola foto no hay miniaturas
    vistas.forEach(function (v) {
      var src = ruta(p, estado.color, v);
      var b = boton('mk-mini', { 'aria-pressed': v === estado.vista, 'aria-label': nombreVista(v) });
      var img = document.createElement('img'); img.alt = ''; img.loading = 'lazy'; claseImg(img, v);
      img.addEventListener('load', function () { claseImg(img, v, esOpaca(img)); });
      img.src = src;
      b.appendChild(img);
      b.addEventListener('click', function () { verVista(v); });
      minis.appendChild(b);
    });
    verVista(estado.vista);
    // Precarga del otro color para que el cambio sea instantáneo
    p.colores.forEach(function (c) { if (c !== estado.color) precarga(ruta(p, c, '01')); });
  }

  function verVista(v) {
    estado.vista = v;
    var foto = $('.js-foto'), src = ruta(estado.p, estado.color, v);
    document.querySelectorAll('.mk-mini').forEach(function (m, i) { m.setAttribute('aria-pressed', VISTAS[i] === v); });
    if (foto.getAttribute('src') === src) return;
    foto.classList.add('cargando');
    var nueva = new Image();
    nueva.onload = nueva.onerror = function () {
      foto.src = src; claseImg(foto, v, nueva.naturalWidth ? esOpaca(nueva) : true);
      foto.alt = estado.p.nombre + ', ' + (estado.color !== 'unico' ? 'color ' + nombreColor(estado.color) + ', ' : '') + nombreVista(v);
      foto.classList.remove('cargando');
    };
    nueva.src = src;
  }

  function actualizarURL() {
    var u = new URLSearchParams({ c: col.slug, p: estado.p.producto });
    if (estado.p.colores.length > 1) u.set('color', estado.color);
    try { history.replaceState(null, '', '?' + u.toString()); } catch (e) {}
  }

  /* ---------- Carrusel: el resto de productos de la colección ---------- */
  var pista = $('.js-pista'), prev = $('.js-prev'), next = $('.js-next');

  function visibles() { return parseInt(getComputedStyle(pista).getPropertyValue('--vis'), 10) || 3; }

  function pintarCarrusel() {
    var otros = productos.filter(function (p) { return p !== estado.p; });
    pista.innerHTML = '';
    otros.forEach(function (p) {
      var li = document.createElement('li');
      var b = boton('mk-tarjeta', { 'aria-label': p.nombre + ', ' + SC.euros(p.precio) },
        '<span class="mk-tarjeta__img"><img src="' + ruta(p, p.colores[0], '01') + '" alt="" loading="lazy"></span>' +
        '<span class="mk-tarjeta__n"></span>' +
        '<span class="mk-tarjeta__p">' + SC.euros(p.precio) + '</span>');
      // En la tarjeta basta con el tipo de producto: "Sudadera La Catrina" → "Sudadera"
      var corto = p.nombre.slice(-col.nombre.length) === col.nombre ? p.nombre.slice(0, -col.nombre.length).trim() : p.nombre;
      b.querySelector('.mk-tarjeta__n').textContent = corto || p.nombre;
      b.addEventListener('click', function () {
        elegir(p);
        var ficha = $('.js-ficha');
        if (ficha.getBoundingClientRect().top < 0) ficha.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      li.appendChild(b); pista.appendChild(li);
    });
    estado.inicio = 0;
    mover(0);
  }

  function mover(delta) {
    var total = pista.children.length, vis = visibles(), max = Math.max(0, total - vis);
    estado.inicio = Math.min(max, Math.max(0, estado.inicio + delta));
    var li = pista.children[estado.inicio];
    pista.style.transform = li ? 'translateX(' + (-(li.offsetLeft - pista.children[0].offsetLeft)) + 'px)' : '';
    prev.disabled = estado.inicio === 0;
    next.disabled = estado.inicio >= max;
  }
  prev.addEventListener('click', function () { mover(-1); });
  next.addEventListener('click', function () { mover(1); });
  window.addEventListener('resize', function () { mover(0); });

  // Deslizar con el dedo en móvil
  var x0 = null;
  pista.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  pista.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) mover(dx < 0 ? 1 : -1);
  });

  /* ---------- Visor ampliado (paspartú) ----------
     Clic en la foto principal → pop-up cuadrado ~2,5× su ancho, limitado al 92 % de la pantalla.
     Vale para cualquier producto y cualquier vista, porque lee la foto que esté visible en ese momento. */
  var visor = $('.js-visor'), visorImg = $('.js-visor-img'), principal = $('.js-ampliar');
  var ESCALA = 2.5;

  function abrirVisor() {
    var foto = $('.js-foto');
    if (!foto.getAttribute('src') || foto.classList.contains('cargando')) return;
    var lado = Math.min(principal.getBoundingClientRect().width * ESCALA, window.innerWidth * 0.92, window.innerHeight * 0.92);
    visor.style.setProperty('--lado', Math.round(lado) + 'px');
    visorImg.src = foto.src; visorImg.alt = foto.alt;
    visorImg.classList.toggle('cubre', foto.classList.contains('cubre'));
    document.documentElement.classList.add('mk-sin-scroll');
    if (visor.showModal) visor.showModal(); else visor.setAttribute('open', '');
  }
  function cerrarVisor() { if (visor.close) visor.close(); else visor.removeAttribute('open'); }

  principal.addEventListener('click', abrirVisor);
  principal.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirVisor(); }
  });
  $('.js-visor-cerrar').addEventListener('click', cerrarVisor);
  // Clic fuera del paspartú (en el fondo oscuro) también cierra
  visor.addEventListener('click', function (e) { if (e.target === visor) cerrarVisor(); });
  visor.addEventListener('close', function () { document.documentElement.classList.remove('mk-sin-scroll'); principal.focus(); });

  /* ---------- Compra ---------- */
  $('.js-menos').addEventListener('click', function () { estado.cant = Math.max(1, estado.cant - 1); $('.js-cant').textContent = estado.cant; });
  $('.js-mas').addEventListener('click', function () { estado.cant = Math.min(9, estado.cant + 1); $('.js-cant').textContent = estado.cant; });
  $('.js-anadir').addEventListener('click', function () {
    var p = estado.p;
    SC.bolsa.anadir({ coleccion: p.coleccion, producto: p.producto, nombre: p.nombre, color: estado.color, talla: estado.talla, cantidad: estado.cant, precio: p.precio });
    var det = [estado.color !== 'unico' ? nombreColor(estado.color) : '', estado.talla ? 'talla ' + estado.talla : ''].filter(Boolean).join(', ');
    SC.avisar('Añadido a la cesta · ' + p.nombre + (det ? ' (' + det + ')' : ''));
  });
  $('.js-guia').addEventListener('click', function () { SC.avisar('Guía de tallas · próximamente'); });

  /* ---------- Arranque ---------- */
  var inicial = productos.filter(function (p) { return p.producto === q.get('p'); })[0] ||
    productos.filter(function (p) { return p.destacado; })[0] || productos[0];
  elegir(inicial, { color: q.get('color') });
})();
