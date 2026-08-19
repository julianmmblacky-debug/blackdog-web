
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
// show inicio on load
nav('inicio');
