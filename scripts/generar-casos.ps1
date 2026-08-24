<#
Generador del sistema de casos reales.
Lee /casos/casos.json, aplica /templates/caso.html y:
  1) genera una pagina estatica por caso en /cremallera-{marca}/caso-{id}/index.html
  2) regenera el bloque de tarjetas + filtros dentro de /cremallera-{marca}/index.html
     (solo lo que hay entre <!-- CASOS:{MARCA}:START --> y <!-- CASOS:{MARCA}:END -->,
     el resto de la pagina de marca no se toca)
  3) anade las URLs de los casos a sitemap.xml (entre <!-- CASOS:START --> y <!-- CASOS:END -->)

No hay backend ni build en Cloudflare: este script se ejecuta en local (o lo ejecuta Claude)
y el resultado son ficheros HTML planos que se commitean igual que cualquier otro cambio.

Uso: powershell -ExecutionPolicy Bypass -File scripts\generar-casos.ps1
#>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$build = Get-Date -Format 'yyyyMMddHHmmss'

# El resto del sitio son ficheros UTF-8 SIN BOM. Get-Content/Set-Content de
# Windows PowerShell 5.1 no son de fiar aqui (usan la codepage del sistema,
# no UTF-8), asi que leemos y escribimos siempre explicitamente por .NET.
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
function Read-Utf8($path) { [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8) }
function Write-Utf8($path, $text) { [System.IO.File]::WriteAllText($path, $text, $Utf8NoBom) }

$etiquetasCategoria = @{
  'fuga'            = 'Fuga'
  'holgura'         = 'Holgura'
  'sin-recambio'    = 'Sin recambio'
  'eje-desgastado'  = 'Eje desgastado'
  'ruido'           = 'Ruido'
  'direccion-activa' = 'Dirección activa'
}

function Etiqueta($slug) {
  if ($etiquetasCategoria.ContainsKey($slug)) { return $etiquetasCategoria[$slug] }
  return (Get-Culture).TextInfo.ToTitleCase(($slug -replace '-', ' '))
}

function WaLink($modelo) {
  $texto = "Hola Julian, tengo una cremallera/caja de direccion de un $modelo [ano]. El problema es [sintoma]. Vi el caso que teneis publicado y queria consultar el mio. Puedes decirme si tiene reparacion y darme una orientacion de precio?"
  return "https://wa.me/34697501984?text=" + [Uri]::EscapeDataString($texto)
}

$casos = Read-Utf8 (Join-Path $root 'casos\casos.json') | ConvertFrom-Json
$plantilla = Read-Utf8 (Join-Path $root 'templates\caso.html')

# ── 1) Paginas individuales de cada caso ──────────────────────────────
foreach ($c in $casos) {
  $html = $plantilla
  $waLink = WaLink $c.modelo
  $wmClass = if ($c.marca_agua) { 'foto-wm' } else { '' }

  $referenciaBlock = ''
  if ($c.referencia) {
    $referenciaBlock = "<div class=""modelo-ref"" style=""margin-top:6px"">Referencia: $($c.marca_nombre) $($c.referencia)</div>"
  }

  $clienteContoBlock = ''
  if ($c.cliente_conto) {
    $clienteContoBlock = "<div class=""caso-quote reveal""><span class=""caso-quote-label"">Lo que nos contó el cliente</span><p>$($c.cliente_conto)</p></div>"
  }

  $respondimosBlock = ''
  if ($c.respondimos) {
    $respondimosBlock = "<div class=""caso-quote reveal""><span class=""caso-quote-label"">Lo que respondimos</span><p>$($c.respondimos)</p></div>"
  }

  $llegadaFotosHtml = ''
  if ($c.llegada_fotos -and $c.llegada_fotos.Count -gt 0) {
    $figs = foreach ($f in $c.llegada_fotos) {
      $cap = if ($f.caption) { "<figcaption>$($f.caption)</figcaption>" } else { '' }
      "<figure><div class=""$wmClass""><img class=""lightbox-img"" src=""$($f.src)"" loading=""lazy"" alt=""$($f.alt)""></div>$cap</figure>"
    }
    $llegadaFotosHtml = "<div class=""caso-llegada-fotos reveal"">" + ($figs -join "`n") + "</div>"
  }

  $citaFinalBlock = ''
  if ($c.cita_final) {
    $citaFinalBlock = "<div class=""sec-head"" style=""margin-top:40px""><span class=""eyebrow"">Lo que nos dijo después</span></div><p class=""caso-testimonio"" style=""font-size:1.05rem"">$($c.cita_final)</p>"
  }

  $galeriaBlock = ''
  if ($c.galeria -and $c.galeria.Count -gt 0) {
    $imgs = foreach ($g in $c.galeria) { "<div class=""$wmClass""><img class=""lightbox-img"" src=""$($g.src)"" loading=""lazy"" alt=""$($g.alt)""></div>" }
    $galeriaBlock = "<div class=""sec-head"" style=""margin-top:40px""><span class=""eyebrow"">Más fotos del caso</span></div><div class=""caso-galeria-extra reveal"">" + ($imgs -join "`n") + "</div>"
  }

  $tokens = @{
    '__BUILD__'               = $build
    '__MARCA__'                = $c.marca
    '__MARCA_NOMBRE__'         = $c.marca_nombre
    '__ID__'                   = $c.id
    '__MODELO__'                = $c.modelo
    '__TITULO__'                = $c.titulo
    '__TITULO_LOWER__'          = $c.titulo.ToLower()
    '__FOTO_PORTADA__'          = $c.foto_portada
    '__FOTO_PORTADA_ALT__'      = $c.foto_portada_alt
    '__FECHA__'                 = $c.fecha
    '__REFERENCIA_BLOCK__'      = $referenciaBlock
    '__CLIENTE_CONTO_BLOCK__'   = $clienteContoBlock
    '__RESPONDIMOS_BLOCK__'     = $respondimosBlock
    '__LLEGADA_TEXTO__'         = $c.llegada_texto
    '__LLEGADA_FOTOS_HTML__'    = $llegadaFotosHtml
    '__RESULTADO__'             = $c.resultado
    '__CITA_FINAL_BLOCK__'      = $citaFinalBlock
    '__GALERIA_BLOCK__'         = $galeriaBlock
    '__WA_LINK__'                = $waLink
    '__WM_CLASS__'                = $wmClass
  }
  foreach ($k in $tokens.Keys) { $html = $html.Replace($k, [string]$tokens[$k]) }

  $dir = Join-Path $root "cremallera-$($c.marca)\caso-$($c.id)"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Write-Utf8 (Join-Path $dir 'index.html') $html
  Write-Host "Generado: cremallera-$($c.marca)/caso-$($c.id)/"
}

# ── 2) Bloque de tarjetas + filtros en cada pagina de marca ───────────
$porMarca = $casos | Group-Object marca
foreach ($grupo in $porMarca) {
  $marca = $grupo.Name
  $marcaNombre = $grupo.Group[0].marca_nombre
  $marcaUpper = $marca.ToUpper()
  $indexPath = Join-Path $root "cremallera-$marca\index.html"
  if (-not (Test-Path $indexPath)) {
    Write-Host "AVISO: no existe $indexPath, salto marca '$marca'"
    continue
  }

  $modelos = $grupo.Group | Select-Object -ExpandProperty modelo_slug -Unique
  $cats = $grupo.Group | ForEach-Object { $_.categorias } | Select-Object -Unique

  $numCasos = $grupo.Group.Count
  $countLabel = if ($numCasos -eq 1) { '1 caso publicado' } else { "$numCasos casos publicados" }

  $filtroModelos = foreach ($m in $modelos) {
    $label = ($grupo.Group | Where-Object { $_.modelo_slug -eq $m } | Select-Object -First 1).modelo -replace "^$marcaNombre\s+", ''
    "      <button class=""filtro-btn"" data-filtro=""$m"">$label</button>"
  }
  $filtroCats = foreach ($cat in $cats) {
    "      <button class=""filtro-btn"" data-filtro=""$cat"">$(Etiqueta $cat)</button>"
  }

  $tarjetas = foreach ($c in $grupo.Group) {
    $catsAttr = ($c.categorias -join ' ')
    $wmClassMini = if ($c.marca_agua) { ' foto-wm' } else { '' }

    $extraFotos = @()
    if ($c.llegada_fotos) { $extraFotos += $c.llegada_fotos }
    if ($c.galeria) { $extraFotos += $c.galeria }

    $extraHtml = ''
    if ($extraFotos.Count -gt 0) {
      $mostrar = $extraFotos | Select-Object -First 3
      $resto = $extraFotos.Count - $mostrar.Count
      $miniImgs = foreach ($ef in $mostrar) { "<img src=""$($ef.src)"" loading=""lazy"" alt=""$($ef.alt)"">" }
      $masBadge = if ($resto -gt 0) { "<span class=""caso-mini-extra-more"">+$resto</span>" } else { '' }
      $extraHtml = "<div class=""caso-mini-extra"">" + ($miniImgs -join '') + $masBadge + "</div>"
    }
@"
    <a class="caso-mini reveal" href="/cremallera-$marca/caso-$($c.id)/" data-modelo="$($c.modelo_slug)" data-cat="$catsAttr">
      <div class="caso-mini-img$wmClassMini"><img src="$($c.foto_portada)" loading="lazy" alt="$($c.foto_portada_alt)"></div>
      <div class="caso-mini-body">
        <div class="caso-mini-model">$($c.modelo)</div>
        <div class="caso-mini-tag">$($c.tag)</div>
        $extraHtml
        <span class="caso-mini-link">Ver caso →</span>
      </div>
    </a>
"@
  }

  $bloque = @"
<!-- CASOS:$($marcaUpper):START -->
  <p class="caso-count">$countLabel</p>
  <div class="caso-filtros" data-target="casos-grid-$marca">
    <div class="filtro-row" data-filtro-group="modelo">
      <button class="filtro-btn active" data-filtro="todos">Todos</button>
$($filtroModelos -join "`n")
    </div>
    <div class="filtro-row" data-filtro-group="cat">
      <button class="filtro-btn active" data-filtro="todos">Todos</button>
$($filtroCats -join "`n")
    </div>
  </div>
  <div class="caso-grid-full" id="casos-grid-$marca">
$($tarjetas -join "`n")
  </div>
  <p class="caso-sin-resultados">Todavía no hay ningún caso con ese filtro — pero puede que el tuyo sea el siguiente. Escríbeme por WhatsApp.</p>
  <!-- CASOS:$($marcaUpper):END -->
"@

  $contenido = Read-Utf8 $indexPath
  $marker1 = "<!-- CASOS:$($marcaUpper):START -->"
  $marker2 = "<!-- CASOS:$($marcaUpper):END -->"
  $i1 = $contenido.IndexOf($marker1)
  $i2 = $contenido.IndexOf($marker2)
  if ($i1 -lt 0 -or $i2 -lt 0 -or $i2 -lt $i1) {
    Write-Host "AVISO: no se encontraron marcadores CASOS:$($marcaUpper) en $indexPath — no se toca el archivo."
    continue
  }
  $antes = $contenido.Substring(0, $i1)
  $despues = $contenido.Substring($i2 + $marker2.Length)
  $nuevoContenido = $antes + $bloque + $despues
  Write-Utf8 $indexPath $nuevoContenido
  Write-Host "Actualizado: cremallera-$marca/index.html (bloque de casos)"
}

# ── 3) Sitemap ─────────────────────────────────────────────────────────
$sitemapPath = Join-Path $root 'sitemap.xml'
if (Test-Path $sitemapPath) {
  $sitemap = Read-Utf8 $sitemapPath
  if ($sitemap.IndexOf('<!-- CASOS:START -->') -lt 0) {
    $sitemap = $sitemap.Replace('</urlset>', "  <!-- CASOS:START -->`n  <!-- CASOS:END -->`n</urlset>")
  }
  $entradas = foreach ($c in $casos) {
@"
  <url>
    <loc>https://www.reparacion-cremallera-direccion.com/cremallera-$($c.marca)/caso-$($c.id)/</loc>
    <lastmod>$($c.fecha)</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
"@
  }
  $bloqueSitemap = "<!-- CASOS:START -->`n" + ($entradas -join "`n") + "`n  <!-- CASOS:END -->"
  $s1 = $sitemap.IndexOf('<!-- CASOS:START -->')
  $s2 = $sitemap.IndexOf('<!-- CASOS:END -->')
  $marker2Len = '<!-- CASOS:END -->'.Length
  $sitemap = $sitemap.Substring(0, $s1) + $bloqueSitemap + $sitemap.Substring($s2 + $marker2Len)
  Write-Utf8 $sitemapPath $sitemap
  Write-Host "Actualizado: sitemap.xml ($($casos.Count) casos)"
}

Write-Host "`nListo. $($casos.Count) casos procesados."
