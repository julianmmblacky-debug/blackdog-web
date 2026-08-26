const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.14});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// "Encuéntrala aquí" — formulario en dos pasos (reparar / intercambio) enviado por email vía Web3Forms
// Basado en clases, no en IDs, para poder repetir el mismo bloque en varias páginas sin que choquen.
function icElegir(btn, tipo){
  var wrap = btn.closest('.intercambio-form');
  if (!wrap) return;
  var form = wrap.querySelector('.icForm');
  if (!form) return;
  // el formulario ya está siempre visible: los botones solo marcan el tipo y muestran/ocultan los campos de intercambio
  // ojo: solo el grupo de botones al que pertenece btn, no el de "prioridad" que también usa .ic-step1
  btn.closest('.ic-step1').querySelectorAll('button').forEach(function(b){ b.classList.remove('ic-activo'); });
  btn.classList.add('ic-activo');
  var tipoTexto = tipo === 'reparar' ? 'Reparación' : tipo === 'intercambio' ? 'Pieza de intercambio' : 'Reparación o pieza de intercambio (no lo tiene claro)';
  var subjectTexto = tipo === 'reparar' ? 'Nueva petición de reparación (web)' : tipo === 'intercambio' ? 'Nueva petición de pieza de intercambio (web)' : 'Nueva petición: reparación o intercambio (web)';
  var tipoInput = form.querySelector('.icTipo');
  var subjectInput = form.querySelector('.icSubject');
  if (tipoInput) tipoInput.value = tipoTexto;
  if (subjectInput) subjectInput.value = subjectTexto;
  var busca2 = form.querySelector('.icQueBusca2');
  var busca2Texto = form.querySelector('.icQueBusca2Texto');
  if (busca2 && busca2Texto) {
    var texto = tipo === 'reparar' ? 'Información sobre la reparación' : tipo === 'intercambio' ? 'Disponibilidad / stock' : 'Información sobre la reparación y disponibilidad / stock';
    busca2.value = texto;
    busca2Texto.textContent = texto;
  }
}

// Asunto del correo: se calcula justo antes de enviar, cuando ya sabemos marca/modelo/tipo de pieza
function icBuildSubject(form){
  var tipo = form.querySelector('.icTipo').value;
  var accion = tipo.indexOf('Reparación') === 0 ? 'Reparar' : tipo.indexOf('Pieza de intercambio') === 0 ? 'Intercambio' : 'Reparar o intercambio';
  var tipoPiezaEl = form.querySelector('[name="Tipo de pieza"]');
  var tipoPiezaOtro = form.querySelector('[name="Tipo de pieza (otro)"]');
  var pieza = 'pieza';
  if (tipoPiezaEl && tipoPiezaEl.value === 'Otra cosa' && tipoPiezaOtro && tipoPiezaOtro.value.trim()) {
    pieza = tipoPiezaOtro.value.trim().toLowerCase();
  } else if (tipoPiezaEl && tipoPiezaEl.value && tipoPiezaEl.value !== 'No lo sé' && tipoPiezaEl.value !== 'Otra cosa') {
    pieza = tipoPiezaEl.value.toLowerCase();
  }
  var marca = form.querySelector('[name="Marca"]').value.trim();
  var modelo = form.querySelector('[name="Modelo"]').value.trim();
  var coche = [marca, modelo].filter(Boolean).join(' ');
  return 'BLACKDOG — ' + accion + ' ' + pieza + (coche ? ' · ' + coche : '');
}

function icElegirPrioridad(btn){
  var wrap = btn.closest('.ic-prioridad');
  if (!wrap) return;
  wrap.querySelectorAll('button').forEach(function(b){ b.classList.remove('ic-activo'); });
  btn.classList.add('ic-activo');
  var hidden = wrap.querySelector('.icPrioridad');
  if (hidden) hidden.value = btn.dataset.val;
}

// El número de cada bloque se pone verde en cuanto hay algo relleno ahí dentro
var icStepFields = {
  1: ['Marca', 'Modelo', 'Anio', 'Motor', 'Ciudad', 'Referencia', 'Tipo de pieza', 'Tipo de pieza (otro)'],
  2: ['Sintoma', 'Otro motivo', 'Desmontada', 'Urgencia', 'Cuanto puede esperar', 'Que busca'],
  3: ['attachment', 'Observaciones'],
  4: ['Telefono', 'Email', 'Prefiere contacto por']
};
function icHasValue(form, name){
  var els = form.querySelectorAll('[name="' + name + '"]');
  for (var i = 0; i < els.length; i++){
    var el = els[i];
    if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) return true; }
    else if (el.type === 'file') { if (el.files && el.files.length) return true; }
    else if (el.value && el.value.trim()) return true;
  }
  return false;
}
function icUpdateProgress(form){
  var wrap = form.closest('.intercambio-form');
  if (!wrap) return;
  Object.keys(icStepFields).forEach(function(step){
    var done = icStepFields[step].some(function(n){ return icHasValue(form, n); });
    if (step === '3' && form.querySelector('.icTieneFotos:checked')) done = true;
    var badge = wrap.querySelector('.ic-step-num[data-step="' + step + '"]');
    if (badge) badge.classList.toggle('ic-step-done', done);
  });
}
function icUpdateFieldHighlights(form){
  form.querySelectorAll('.intercambio-row input, .intercambio-row select, .intercambio-row textarea').forEach(function(el){
    if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'hidden') return;
    var lleno = el.type === 'file' ? !!(el.files && el.files.length) : !!(el.value && el.value.trim());
    el.classList.toggle('ic-filled', lleno);
  });
}
function icCheckEmailRequired(form){
  var emailInput = form.querySelector('.icEmailInput');
  var errorMsg = form.querySelector('.icEmailError');
  var quiereEmail = form.querySelector('[name="Prefiere contacto por"][value="Email"]:checked');
  if (!emailInput || !errorMsg) return true;
  var falta = !!quiereEmail && !emailInput.value.trim();
  errorMsg.style.display = falta ? 'block' : 'none';
  emailInput.style.borderColor = falta ? '#e24b4a' : '';
  return !falta;
}
document.querySelectorAll('.icForm').forEach(function(form){
  form.addEventListener('input', function(){ icUpdateProgress(form); icCheckEmailRequired(form); icUpdateFieldHighlights(form); });
  form.addEventListener('change', function(){ icUpdateProgress(form); icCheckEmailRequired(form); icUpdateFieldHighlights(form); });
});

// Por defecto se marca "Reparar mi pieza original" para que se vea claro desde el primer vistazo
document.querySelectorAll('.intercambio-form').forEach(function(wrap){
  var primerBtn = wrap.querySelector('.ic-step1 button');
  if (primerBtn) icElegir(primerBtn, 'reparar');
});

function icToggleUrgencia(sel){
  var form = sel.closest('form');
  var detalle = form && form.querySelector('.icUrgenciaDetalle');
  if (!detalle) return;
  var mostrar = sel.value === 'Tengo prisa, el coche está parado';
  detalle.style.display = mostrar ? 'grid' : 'none';
  var detalleSelect = detalle.querySelector('select');
  detalleSelect.required = mostrar;
  if (!mostrar) detalleSelect.value = '';
}

function icToggleTipoPieza(sel){
  var form = sel.closest('form');
  var detalle = form && form.querySelector('.icTipoPiezaDetalle');
  if (!detalle) return;
  var mostrar = sel.value === 'Otra cosa';
  detalle.style.display = mostrar ? 'grid' : 'none';
  if (!mostrar) detalle.querySelector('input').value = '';
}

function icToggleOtro(cb){
  var form = cb.closest('form');
  var texto = form && form.querySelector('.icOtroTexto');
  if (texto) texto.style.display = cb.checked ? 'block' : 'none';
}

function icToggleFotos(cb){
  var form = cb.closest('form');
  var wrap = form && form.querySelector('.icFotosWrap');
  if (!wrap) return;
  var fileInput = wrap.querySelector('[name="attachment"]');
  wrap.style.display = cb.checked ? 'block' : 'none';
  if (fileInput) {
    fileInput.required = cb.checked;
    if (!cb.checked) fileInput.value = '';
  }
}

// Si el cliente adjunta foto o vídeo, el correo no puede llevarlo (los servicios gratuitos no admiten adjuntos),
// así que la petición completa se manda por WhatsApp en su lugar — ahí sí puede ir el archivo.
function icBuildWhatsAppText(form){
  var get = function(name){ var el = form.querySelector('[name="'+name+'"]'); return el ? el.value.trim() : ''; };
  var getChecked = function(name){
    return Array.prototype.slice.call(form.querySelectorAll('[name="'+name+'"]:checked')).map(function(cb){return cb.value;}).join(', ');
  };
  var lines = [];
  lines.push('Hola Julián, te escribo desde la web (Encuéntrala aquí).');
  lines.push('Tipo: ' + (get('Tipo de peticion') || 'Petición'));
  if (get('Prioridad')) lines.push('Prioridad: ' + get('Prioridad'));
  var coche = [get('Marca'), get('Modelo'), get('Anio'), get('Motor')].filter(Boolean).join(' / ');
  if (coche) lines.push('Coche: ' + coche);
  var sintomas = getChecked('Sintoma');
  var otro = get('Otro motivo');
  if (sintomas || otro) lines.push('Síntomas: ' + [sintomas, otro].filter(Boolean).join(' — '));
  if (get('Desmontada')) lines.push('¿Desmontada?: ' + get('Desmontada'));
  if (get('Urgencia')) lines.push('Urgencia: ' + get('Urgencia'));
  if (get('Cuanto puede esperar')) lines.push('¿Cuánto puede esperar?: ' + get('Cuanto puede esperar'));
  var quebusca = getChecked('Que busca');
  if (quebusca) lines.push('Busca: ' + quebusca);
  if (get('Referencia')) lines.push('Referencia: ' + get('Referencia'));
  if (get('Ciudad')) lines.push('Ciudad: ' + get('Ciudad'));
  if (get('Observaciones')) lines.push('Observaciones: ' + get('Observaciones'));
  if (get('Telefono')) lines.push('Teléfono: ' + get('Telefono'));
  if (get('Email')) lines.push('Email: ' + get('Email'));
  var prefiere = getChecked('Prefiere contacto por');
  if (prefiere) lines.push('Prefiere contacto por: ' + prefiere);
  lines.push('');
  lines.push('📎 Te adjunto foto/vídeo a continuación.');
  return lines.join('\n');
}

function icMostrarConfirmacion(form, mensaje){
  var pageInner = form.closest('.page-inner');
  if (!pageInner) return;
  pageInner.innerHTML = '<div class="wrap" style="max-width:560px;margin:0 auto;padding:min(18vh,140px) 24px 60px;text-align:center">' +
    '<svg width="52" height="52" viewBox="0 0 24 24" style="margin-bottom:18px"><circle cx="12" cy="12" r="11" fill="#25A35A"/><path d="M7 12.5l3 3 7-7" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<p style="color:var(--bone);font-weight:700;font-size:1.5rem;margin:0 0 14px">¡Petición recibida!</p>' +
    '<p style="color:var(--bone-dim);margin:0 0 30px;line-height:1.6;font-size:1.05rem">' + mensaje + '</p>' +
    '<a href="/" style="color:var(--yellow);font-family:\'IBM Plex Mono\',monospace;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;padding:10px 20px;border:1px solid rgba(242,194,0,.3);border-radius:4px">← Volver a inicio</a>' +
    '</div>';
}

document.querySelectorAll('.icForm').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!icCheckEmailRequired(form)) {
      form.querySelector('.icEmailInput').focus();
      form.querySelector('.icEmailInput').scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    var subjectField = form.querySelector('.icSubject');
    if (subjectField) subjectField.value = icBuildSubject(form);
    var tieneFotos = form.querySelector('.icTieneFotos');
    var accessKey = form.querySelector('[name="access_key"]').value;
    if (tieneFotos && tieneFotos.checked) {
      trackGA4('form_submit', { location: 'intercambio-form-whatsapp' });
      // Copia de respaldo por email (sin el archivo) para que siempre quede registro,
      // aunque el cliente abra WhatsApp y luego no llegue a darle a enviar allí.
      if (accessKey !== 'PENDIENTE_CLAVE_WEB3FORMS') {
        var dataCopia = new FormData(form);
        dataCopia.delete('attachment');
        if (subjectField) dataCopia.set('subject', subjectField.value + ' — copia (foto enviada por WhatsApp)');
        fetch('https://api.web3forms.com/submit', { method: 'POST', body: dataCopia }).catch(function(){});
      }
      var texto = icBuildWhatsAppText(form);
      window.open('https://wa.me/34697501984?text=' + encodeURIComponent(texto), '_blank');
      icMostrarConfirmacion(form, 'Abrimos WhatsApp con tu petición ya escrita — solo tienes que adjuntar la foto o el vídeo y darle a enviar.');
      return;
    }
    if (accessKey === 'PENDIENTE_CLAVE_WEB3FORMS') {
      alert('Falta conectar la clave de Web3Forms todavía — esto es solo una vista previa del formulario.');
      return;
    }
    var data = new FormData(form);
    var btn = form.querySelector('button[type="submit"]');
    var textoOriginal = btn.textContent;
    btn.disabled = true; btn.textContent = 'Enviando...';
    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (res.success) {
          trackGA4('form_submit', { location: 'intercambio-form' });
          icMostrarConfirmacion(form, 'Te enviaremos fotos e información antes de que decidas — te contestamos por donde nos has dicho. Si lo prefieres, también puedes escribirme directamente al 697 50 19 84, es donde estoy más activo. Si llamas y no contesto, seguramente esté con las manos en el taller — te devuelvo la llamada o te escribo en cuanto lo vea.');
        } else {
          btn.disabled = false; btn.textContent = textoOriginal;
          alert('No se pudo enviar. Prueba de nuevo o escríbeme por WhatsApp.');
        }
      })
      .catch(function(){
        btn.disabled = false; btn.textContent = textoOriginal;
        alert('No se pudo enviar. Prueba de nuevo o escríbeme por WhatsApp.');
      });
  });
});

// Lightbox — ampliar foto al pulsarla (fotos secundarias del caso individual)
if (document.querySelectorAll('.lightbox-img').length) {
  var overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = '<span class="lightbox-close" aria-label="Cerrar">✕</span><img alt="">';
  document.body.appendChild(overlay);
  var overlayImg = overlay.querySelector('img');
  function openLightbox(src, alt) {
    overlayImg.src = src;
    overlayImg.alt = alt || '';
    overlay.classList.add('open');
  }
  function closeLightbox() { overlay.classList.remove('open'); overlayImg.src = ''; }
  document.querySelectorAll('.lightbox-img').forEach(function(img){
    img.addEventListener('click', function(){ openLightbox(img.currentSrc || img.src, img.alt); });
  });
  overlay.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeLightbox(); });
}

// Filtros del archivo de casos (por modelo y por problema)
document.querySelectorAll('.caso-filtros').forEach(function(filtrosEl){
  var grid = document.getElementById(filtrosEl.dataset.target);
  if(!grid) return;
  var state = {};
  filtrosEl.querySelectorAll('.filtro-row').forEach(function(row){
    state[row.dataset.filtroGroup] = 'todos';
  });
  function apply(){
    var visible = 0;
    grid.querySelectorAll('.caso-mini').forEach(function(card){
      var show = Object.keys(state).every(function(group){
        if(state[group] === 'todos') return true;
        var val = card.dataset[group] || '';
        return (' ' + val + ' ').indexOf(' ' + state[group] + ' ') !== -1;
      });
      card.style.display = show ? '' : 'none';
      if(show) visible++;
    });
    var empty = grid.parentElement.querySelector('.caso-sin-resultados');
    if(empty) empty.style.display = visible ? 'none' : 'block';
  }
  filtrosEl.querySelectorAll('.filtro-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var row = btn.closest('.filtro-row');
      row.querySelectorAll('.filtro-btn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      state[row.dataset.filtroGroup] = btn.dataset.filtro;
      apply();
    });
  });
});

const burger=document.getElementById('hdBurger');
const mnav=document.getElementById('hdMobileNav');
if(burger && mnav){
  burger.addEventListener('click',()=>{
    const open=mnav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true':'false');
  });
  mnav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    mnav.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
  }));
}

const navLinks=document.querySelectorAll('.hd-nav a[href^="#"]');
const sections=[...navLinks].map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
const navIO=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const id='#'+entry.target.id;
      navLinks.forEach(a=>a.classList.toggle('active', a.getAttribute('href')===id));
    }
  });
},{rootMargin:'-40% 0px -55% 0px', threshold:0});
sections.forEach(s=>navIO.observe(s));
function nav(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  var el=document.getElementById('page-'+id);
  if(el){el.classList.add('active');}
  window.scrollTo(0,0);
  // update active nav link
  document.querySelectorAll('.hd-nav a, .hd-mnav a').forEach(a=>{
    a.classList.remove('active');
    if(a.getAttribute('onclick') && a.getAttribute('onclick').includes("'"+id+"'")){
      a.classList.add('active');
    }
  });
  // close mobile nav if open
  var mn=document.getElementById('hdMobileNav');
  var bg=document.getElementById('hdBurger');
  if(mn){mn.classList.remove('open');}
  if(bg){bg.setAttribute('aria-expanded','false');}
}
// show inicio on load (solo si esta pagina es la SPA principal)
if(document.getElementById('page-inicio')){
  var hashId = window.location.hash.replace('#','');
  if(hashId && document.getElementById('page-'+hashId)){
    nav(hashId);
  } else {
    nav('inicio');
  }
}

// Tracking eventos de contacto
window.dataLayer = window.dataLayer || [];
function trackContact(tipo, destino) {
  window.dataLayer.push({
    'event': 'contacto',
    'tipo_contacto': tipo,
    'destino': destino
  });
}
document.addEventListener('DOMContentLoaded', function() {
  // Track WhatsApp clicks
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(el) {
    el.addEventListener('click', function() {
      trackContact('whatsapp', 'WhatsApp 697501984');
    });
  });
  // Track phone clicks
  document.querySelectorAll('a[href*="tel:"]').forEach(function(el) {
    el.addEventListener('click', function() {
      trackContact('telefono', 'Tel 697501984');
    });
  });
  // Track email clicks
  document.querySelectorAll('a[href*="mailto:"]').forEach(function(el) {
    el.addEventListener('click', function() {
      trackContact('email', 'email');
    });
  });
});
// Tracking eventos de contacto — GA4 + GTM
window.dataLayer = window.dataLayer || [];
function trackContact(tipo, destino, pagina) {
  // GTM dataLayer
  window.dataLayer.push({
    'event': 'contacto',
    'tipo_contacto': tipo,
    'destino': destino,
    'pagina_origen': pagina || window.location.hash || 'inicio'
  });
  // GA4 directo
  if(typeof gtag === 'function') {
    gtag('event', 'contacto_' + tipo, {
      'event_category': 'Conversión',
      'event_label': destino,
      'pagina_origen': pagina || window.location.hash || 'inicio',
      'value': 1
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // WhatsApp — evento principal de conversión
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(el) {
    el.addEventListener('click', function() {
      var pagina = document.querySelector('.page.active') ? 
                   document.querySelector('.page.active').id : 'inicio';
      trackContact('whatsapp', 'WhatsApp 697501984', pagina);
    });
  });

  // Teléfono
  document.querySelectorAll('a[href*="tel:"]').forEach(function(el) {
    el.addEventListener('click', function() {
      var pagina = document.querySelector('.page.active') ? 
                   document.querySelector('.page.active').id : 'inicio';
      trackContact('telefono', '697501984', pagina);
    });
  });

  // Email
  document.querySelectorAll('a[href*="mailto:"]').forEach(function(el) {
    el.addEventListener('click', function() {
      trackContact('email', 'julianmmblacky@gmail.com', '');
    });
  });

  // Scroll depth (cuánto lee el usuario antes de contactar)
  var scrollMarcas = [25, 50, 75, 90];
  var marcasEnviadas = {};
  window.addEventListener('scroll', function() {
    var pct = Math.round((window.scrollY + window.innerHeight) / 
              document.body.scrollHeight * 100);
    scrollMarcas.forEach(function(m) {
      if(pct >= m && !marcasEnviadas[m]) {
        marcasEnviadas[m] = true;
        if(typeof gtag === 'function') {
          gtag('event', 'scroll', {
            'event_category': 'Engagement',
            'event_label': m + '%',
            'value': m
          });
        }
      }
    });
  }, {passive: true});

  // Tiempo en página antes de contactar
  var tiempoInicio = Date.now();
  window.addEventListener('beforeunload', function() {
    var segundos = Math.round((Date.now() - tiempoInicio) / 1000);
    if(typeof gtag === 'function' && segundos > 5) {
      gtag('event', 'tiempo_pagina', {
        'event_category': 'Engagement',
        'event_label': segundos + 's',
        'value': segundos,
        'transport_type': 'beacon'
      });
    }
  });
});
