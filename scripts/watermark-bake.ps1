<#
Incrusta el logo BLACKDOG (img/watermark-blackdog.png, PNG con transparencia real)
directamente en los pixeles de las fotos indicadas, esquina inferior derecha,
igual que queda cuando el propio usuario lo incrusta al exportar sus fotos.
Se usa para fotos "crudas" (sacadas directas de un chat de WhatsApp) que no
llevan el logo de origen. Sobrescribe el fichero in-place.

Uso: powershell -ExecutionPolicy Bypass -File scripts\watermark-bake.ps1
#>
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$wmPath = Join-Path $root 'img\watermark-blackdog.png'
$wm = [System.Drawing.Image]::FromFile($wmPath)

$targets = @(
  'img\cremallera_volvo_xc70_completa_antes_sucia.jpg'
)

foreach ($rel in $targets) {
  $path = Join-Path $root $rel
  $img = [System.Drawing.Image]::FromFile($path)
  $bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
  $bmp.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
  $img.Dispose()

  # logo al 15% del ancho de la foto, con margen del 2%
  $wmW = [int]($bmp.Width * 0.15)
  $wmH = [int]($wmW * $wm.Height / $wm.Width)
  $margin = [int]($bmp.Width * 0.02)
  $x = $bmp.Width - $wmW - $margin
  $y = $bmp.Height - $wmH - $margin
  $g.DrawImage($wm, $x, $y, $wmW, $wmH)
  $g.Dispose()

  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L)
  $bmp.Save($path, $encoder, $params)
  $bmp.Dispose()
  Write-Host "Marca de agua incrustada: $rel"
}
$wm.Dispose()
