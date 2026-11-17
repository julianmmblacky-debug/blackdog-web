<#
Pone el logo BLACKDOG (img/watermark-blackdog.png, el mismo que lleva
watermark-bake.ps1 en las fotos) dentro de los vídeos indicados, abajo a la
derecha. Los vídeos son estrechos (de móvil), así que el logo va al 22 % del
ancho (en las fotos, 15 %) para que se lea igual. Sobrescribe el fichero.

Necesita FFmpeg (winget install Gyan.FFmpeg.Essentials).

Uso: powershell -ExecutionPolicy Bypass -File scripts\watermark-video.ps1 img\nuevo\videos\nuevo-video.mp4 [otro.mp4 ...]
#>
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Videos)

$root = Split-Path -Parent $PSScriptRoot
$wm = Join-Path $root 'img\watermark-blackdog.png'
$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ffmpeg) { $ffmpeg = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName }
if (-not $ffmpeg) { throw 'No encuentro FFmpeg. Instálalo con: winget install Gyan.FFmpeg.Essentials' }
if (-not $Videos) { throw 'Indica al menos un vídeo.' }

foreach ($rel in $Videos) {
  $path = if ([IO.Path]::IsPathRooted($rel)) { $rel } else { Join-Path $root $rel }
  $tmp = "$path.marca.mp4"
  # El logo se escala respecto al ancho del vídeo ya girado (los vídeos de móvil pueden venir girados)
  $fc = "[1:v][0:v]scale2ref=w='main_w*0.22':h='ow/mdar'[wm][base];[base][wm]overlay='main_w-overlay_w-main_w*0.025':'main_h-overlay_h-main_w*0.025':format=auto,format=yuv420p"
  & $ffmpeg -v error -y -i $path -i $wm -filter_complex $fc -c:v libx264 -preset slow -crf 22 -c:a copy -movflags +faststart $tmp
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $tmp)) { throw "Falló FFmpeg con $rel" }
  Move-Item -Force $tmp $path
  Write-Host "Logo puesto: $rel"
}
