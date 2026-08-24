<#
Servidor HTTP local minimo para previsualizar el sitio estatico antes de publicar.
Uso: powershell -ExecutionPolicy Bypass -File scripts\static-server.ps1
Luego abrir http://localhost:8123/
#>
$root = Split-Path -Parent $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8123/')
$listener.Start()
Write-Host "Sirviendo $root en http://localhost:8123/ (Ctrl+C para parar)"

$mime = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css'; '.js'='application/javascript'
  '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'; '.svg'='image/svg+xml'
  '.xml'='application/xml'; '.json'='application/json'; '.ico'='image/x-icon'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if ($path -eq '/') { $path = '/index.html' }
  if ($path.EndsWith('/')) { $path = $path + 'index.html' }
  $fs = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
  if (-not (Test-Path $fs) -and (Test-Path (Join-Path $fs 'index.html'))) { $fs = Join-Path $fs 'index.html' }
  if (Test-Path $fs -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($fs)
    $ctype = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    $bytes = [IO.File]::ReadAllBytes($fs)
    $ctx.Response.ContentType = $ctype
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.OutputStream.Close()
}
