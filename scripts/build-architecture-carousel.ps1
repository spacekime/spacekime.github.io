param(
  [string]$PdfPath = "The_Spacekime_Architecture.pdf",
  [string]$OutputImageDir = "assets/img/architecture",
  [string]$ManifestPath = "assets/data/architecture-pages.json",
  [int]$Resolution = 160,
  [int]$JpegQuality = 90
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $PdfPath)) {
  throw "Architecture PDF not found at $PdfPath."
}

$pdfInfoCommand = Get-Command pdfinfo -ErrorAction SilentlyContinue
$pdfToPpmCommand = Get-Command pdftoppm -ErrorAction SilentlyContinue

if ($null -eq $pdfInfoCommand -or $null -eq $pdfToPpmCommand) {
  throw "Both 'pdfinfo' and 'pdftoppm' must be available on PATH to generate architecture slider images."
}

$resolvedPdfPath = (Resolve-Path -LiteralPath $PdfPath).Path
$pdfInfoOutput = & $pdfInfoCommand.Source $resolvedPdfPath
$pageInfoLine = $pdfInfoOutput | Where-Object { $_ -match "^Pages:\s+\d+\s*$" } | Select-Object -First 1

if ([string]::IsNullOrWhiteSpace($pageInfoLine)) {
  throw "Unable to determine page count for $PdfPath."
}

$pageCountMatch = [regex]::Match($pageInfoLine, "^Pages:\s+(\d+)\s*$")

if (-not $pageCountMatch.Success) {
  throw "Unable to parse page count from pdfinfo output for $PdfPath."
}

$pageCount = [int]$pageCountMatch.Groups[1].Value

if ($pageCount -lt 1) {
  throw "Architecture PDF must contain at least one page."
}

if (-not (Test-Path -LiteralPath $OutputImageDir)) {
  New-Item -ItemType Directory -Path $OutputImageDir -Force | Out-Null
}

Get-ChildItem -LiteralPath $OutputImageDir -Filter "page-*.jpg" -ErrorAction SilentlyContinue |
  Remove-Item -Force

for ($page = 1; $page -le $pageCount; $page++) {
  $pageNumber = "{0:D2}" -f $page
  $outputPrefix = Join-Path $OutputImageDir "page-$pageNumber"

  & $pdfToPpmCommand.Source `
    "-jpeg" `
    "-jpegopt" "quality=$JpegQuality" `
    "-r" "$Resolution" `
    "-f" "$page" `
    "-l" "$page" `
    "-singlefile" `
    $resolvedPdfPath `
    $outputPrefix

  if ($LASTEXITCODE -ne 0) {
    throw "pdftoppm failed while rendering page $page of $PdfPath."
  }
}

$manifestDirectory = Split-Path -Parent $ManifestPath

if (-not [string]::IsNullOrWhiteSpace($manifestDirectory) -and -not (Test-Path -LiteralPath $manifestDirectory)) {
  New-Item -ItemType Directory -Path $manifestDirectory -Force | Out-Null
}

@{
  pageCount = $pageCount
} | ConvertTo-Json | Set-Content -LiteralPath $ManifestPath

Write-Host "Generated $pageCount architecture slide image(s) from $PdfPath."
