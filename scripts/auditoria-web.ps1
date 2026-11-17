param([string]$Root = 'C:\Users\Julian Marquez\Desktop\blackdogwebclaudecode')
Set-Location $Root
$utf8 = New-Object System.Text.UTF8Encoding($false)
$issues = New-Object System.Collections.ArrayList
function Add-Issue($page, $msg) { [void]$issues.Add("[$page] $msg") }

$pages = Get-ChildItem -Recurse -File -Filter index.html | Where-Object { $_.FullName -notmatch '\\\.git\\' }
$base = 'https://www.reparacion-cremallera-direccion.com'
$ids = @{}      # url -> set de ids
$html = @{}
foreach ($f in $pages) {
  $rel = $f.FullName.Substring($Root.Length).Replace('\','/')
  $url = ($rel -replace '/index\.html$','/')
  if ($url -eq '') { $url = '/' }
  $t = [IO.File]::ReadAllText($f.FullName, $utf8)
  $html[$url] = $t
  $set = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($m in [regex]::Matches($t, '\bid="([^"]+)"')) { [void]$set.Add($m.Groups[1].Value) }
  $ids[$url] = $set
}

function Resolve-Local([string]$path) {
  $p = ($path -split '[?#]')[0]
  if ($p -eq '' -or $p -eq '/') { return Test-Path (Join-Path $Root 'index.html') }
  $fs = Join-Path $Root ($p.TrimStart('/').Replace('/','\'))
  if (Test-Path $fs -PathType Leaf) { return $true }
  if (Test-Path (Join-Path $fs 'index.html')) { return $true }
  return $false
}

$report = New-Object System.Collections.ArrayList
foreach ($url in ($html.Keys | Sort-Object)) {
  $t = $html[$url]
  # --- estructura básica
  $nTitle = ([regex]::Matches($t,'<title>')).Count
  $nH1    = ([regex]::Matches($t,'<h1[\s>]')).Count
  $nDesc  = ([regex]::Matches($t,'<meta name="description"')).Count
  $canon  = [regex]::Match($t,'rel="canonical" href="([^"]*)"').Groups[1].Value
  $robots = [regex]::Match($t,'<meta name="robots" content="([^"]*)"').Groups[1].Value
  $title  = [regex]::Match($t,'<title>([^<]*)</title>').Groups[1].Value
  if ($nTitle -ne 1) { Add-Issue $url "title: $nTitle (debe ser 1)" }
  if ($nH1 -ne 1)    { Add-Issue $url "h1: $nH1 (debe ser 1)" }
  if ($nDesc -ne 1)  { Add-Issue $url "meta description: $nDesc (debe ser 1)" }
  if ($robots -match 'noindex') { Add-Issue $url "NOINDEX: $robots" }
  $expected = "$base$url"
  if ($canon -ne $expected) { Add-Issue $url "canonical '$canon' != '$expected'" }
  if ($t -match '/nuevo[/"'']' -and $t -notmatch 'img/nuevo') { Add-Issue $url "queda una ruta /nuevo/" }
  foreach ($m in [regex]::Matches($t,'(href|src|content)="(/nuevo/[^"]*)"')) { Add-Issue $url "ruta /nuevo/ viva: $($m.Groups[2].Value)" }
  if ($t -notmatch "googletagmanager\.com/gtm\.js" -or $t -notmatch "GTM-53VWX8G") { Add-Issue $url "SIN GTM" }
  if ($t -notmatch 'G-26M8MHTW9L') { Add-Issue $url "SIN GA4" }
  if ($t -notmatch 'y589jke8p8')   { Add-Issue $url "SIN Clarity" }
  # --- JSON-LD válido
  $jl = [regex]::Matches($t,'(?s)<script type="application/ld\+json">(.*?)</script>')
  $jlBad = 0
  foreach ($m in $jl) { try { $null = $m.Groups[1].Value | ConvertFrom-Json -ErrorAction Stop } catch { $jlBad++ } }
  if ($jlBad -gt 0) { Add-Issue $url "JSON-LD inválido: $jlBad de $($jl.Count) bloques" }
  foreach ($m in [regex]::Matches($t,'"(url|@id|item)":\s*"(https?://[^"]*)"')) {
    $u = $m.Groups[2].Value
    if ($u -like "$base*") { $lp = $u.Substring($base.Length); if ($lp -ne '' -and -not (Resolve-Local $lp)) { Add-Issue $url "JSON-LD apunta a URL inexistente: $u" } }
  }
  # --- enlaces y recursos internos
  $seen = @{}
  foreach ($m in [regex]::Matches($t,'(?:href|src|data-src|poster)="(/[^"]*)"')) {
    $h = $m.Groups[1].Value
    if ($seen.ContainsKey($h)) { continue }; $seen[$h] = 1
    if ($h.StartsWith('//')) { continue }
    $path = ($h -split '[?#]')[0]
    if (-not (Resolve-Local $path)) { Add-Issue $url "enlace/recurso roto: $h"; continue }
    # anclas a otras páginas
    if ($h -match '#(.+)$') {
      $anchor = $Matches[1]
      $target = if ($path -eq '' -or $path -eq '/') { '/' } else { ($path.TrimEnd('/') + '/') }
      if ($ids.ContainsKey($target) -and -not $ids[$target].Contains($anchor) -and -not $ids[$target].Contains("page-$anchor")) { Add-Issue $url "ancla inexistente: $h (no hay id=""$anchor"" en $target)" }
    }
  }
  # anclas dentro de la misma página
  foreach ($m in [regex]::Matches($t,'href="#([^"]+)"')) {
    $a = $m.Groups[1].Value
    if (-not $ids[$url].Contains($a)) { Add-Issue $url "ancla interna sin destino: #$a" }
  }
  [void]$report.Add([pscustomobject]@{ url=$url; title=$title; canon=$canon; robots=($robots -replace ',.*',''); h1=$nH1 })
}

# --- títulos duplicados
$report | Group-Object title | Where-Object { $_.Count -gt 1 } | ForEach-Object { Add-Issue ($_.Group.url -join ', ') "título duplicado: $($_.Name)" }

# --- sitemap
$sm = [IO.File]::ReadAllText((Join-Path $Root 'sitemap.xml'), $utf8)
$locs = [regex]::Matches($sm,'<loc>([^<]+)</loc>') | ForEach-Object { $_.Groups[1].Value }
foreach ($l in $locs) {
  if (-not ($l -like "$base*")) { Add-Issue 'sitemap' "URL de otro dominio: $l"; continue }
  $lp = $l.Substring($base.Length)
  if (-not (Resolve-Local $lp)) { Add-Issue 'sitemap' "URL del sitemap inexistente: $l" }
  elseif (-not $html.ContainsKey($lp)) { Add-Issue 'sitemap' "URL sin index.html propio: $l" }
}
foreach ($u in $html.Keys) { if (($base + $u) -notin $locs) { Add-Issue 'sitemap' "página NO incluida en sitemap: $u" } }
$dups = $locs | Group-Object | Where-Object { $_.Count -gt 1 }; foreach ($d in $dups) { Add-Issue 'sitemap' "URL repetida: $($d.Name)" }

"PÁGINAS REVISADAS: $($html.Count) | URLs en sitemap: $($locs.Count)"
"PROBLEMAS: $($issues.Count)"
$issues | ForEach-Object { $_ }
