const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.14});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

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
