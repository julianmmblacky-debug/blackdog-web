
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
