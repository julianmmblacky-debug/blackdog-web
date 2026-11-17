<#
Copia del sitio para PROBAR sin ensuciar GA4 / GTM / Clarity.
Abrir la web local con la analitica activa cuenta visitas y clics reales desde "localhost".
Esta copia anade a cada pagina una regla que bloquea los scripts externos (GTM, GA4, Clarity);
las fuentes de Google siguen cargando, asi que la web se ve igual.

Uso:
  powershell -ExecutionPolicy Bypass -File scripts\pruebas-sin-analitica.ps1
  powershell -ExecutionPolicy Bypass -File "$env:TEMP\blackdog-pruebas\scripts\static-server.ps1"
  -> abrir http://localhost:8123/  (parar antes el static-server normal si esta en marcha)

Extras para capturas: ?y=1400 desplaza la pagina hasta esa altura (sin animaciones).
Volver a ejecutarlo despues de cada cambio (la copia no se actualiza sola).
#>
param([string]$Src = (Split-Path -Parent $PSScriptRoot), [string]$Dst = (Join-Path $env:TEMP 'blackdog-pruebas'))
if (Test-Path $Dst) { Remove-Item -Recurse -Force $Dst }
robocopy $Src $Dst /E /XD .git /XF *.mp4 /NFL /NDL /NJH /NJS /NP | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)
$csp = '<meta http-equiv="Content-Security-Policy" content="script-src ''self'' ''unsafe-inline''; connect-src ''self''">'
$loader = '<script>(function(){var m=location.search.match(/[?&]y=(\d+)/);if(m){document.write("<style>*{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}</style>");document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll("img").forEach(function(i){i.loading="eager"});document.querySelectorAll(".reveal").forEach(function(e){e.classList.add("in")});var mn=document.querySelector("main");mn.style.transform="translateY(-"+(+m[1]-mn.getBoundingClientRect().top)+"px)"})}})()</script>'
$n = 0
Get-ChildItem $Dst -Recurse -Filter index.html | ForEach-Object {
  $t = [IO.File]::ReadAllText($_.FullName, $utf8)
  $t = [regex]::Replace($t, '<head>', "<head>`n$csp", 1)
  $t = [regex]::Replace($t, '</head>', "$loader`n</head>", 1)
  [IO.File]::WriteAllText($_.FullName, $t, $utf8); $n++
}
"Copia sin analitica lista ($n paginas) en $Dst"
