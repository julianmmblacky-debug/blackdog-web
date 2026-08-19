
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-26M8MHTW9L', {
    'page_title': document.title,
    'send_page_view': true,
    'anonymize_ip': true
  });

  // Conversiones — se disparan cuando el usuario hace clic
  function trackGA4(evento, params) {
    gtag('event', evento, params);
  }
