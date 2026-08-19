
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
