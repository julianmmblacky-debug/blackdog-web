<#
Refresca el ?v= de css/style.css y js/script.js en TODAS las paginas index.html
del repo, para forzar a los navegadores y a Cloudflare (cache de 1 anio,
immutable) a pedir la version nueva tras un cambio de CSS/JS.
#>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$newVersion = Get-Date -Format 'yyyyMMddHHmmss'

$files = Get-ChildItem -Path $root -Recurse -Filter 'index.html' -File

$count = 0
foreach ($f in $files) {
  $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $orig = $text
  $text = [regex]::Replace($text, 'style\.css\?v=\d+', "style.css?v=$newVersion")
  $text = [regex]::Replace($text, 'script\.js\?v=\d+', "script.js?v=$newVersion")
  if ($text -ne $orig) {
    [System.IO.File]::WriteAllText($f.FullName, $text, $Utf8NoBom)
    $count++
  }
}
Write-Host "Version nueva: $newVersion — $count ficheros actualizados de $($files.Count) totales."
