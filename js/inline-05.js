
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
