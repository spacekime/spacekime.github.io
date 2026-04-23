param(
  [string]$ManifestPath = "pdf-sources.json",
  [string]$OutputRoot = ".",
  [switch]$FailOnMissing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-EncodedGitHubPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  return (($Path -split "/") | ForEach-Object {
    [Uri]::EscapeDataString($_)
  }) -join "/"
}

if (-not (Test-Path -LiteralPath $ManifestPath)) {
  Write-Host "PDF sync manifest not found at $ManifestPath. Skipping external PDF sync."
  exit 0
}

$manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json

if ($null -eq $manifest.papers) {
  throw "The manifest at $ManifestPath does not define a 'papers' collection."
}

$headers = @{
  Accept = "application/vnd.github.raw"
  "User-Agent" = "spacekime-pages-pdf-sync"
  "X-GitHub-Api-Version" = "2022-11-28"
}

if (-not [string]::IsNullOrWhiteSpace($env:PAPER_REPO_TOKEN)) {
  $headers.Authorization = "Bearer $($env:PAPER_REPO_TOKEN)"
}

$enabledPapers = @($manifest.papers | Where-Object { $_.enabled -eq $true })

if ($enabledPapers.Count -eq 0) {
  Write-Host "No enabled PDF sync entries found. Deploying repository PDFs as-is."
  exit 0
}

foreach ($paper in $enabledPapers) {
  $paperName = if ([string]::IsNullOrWhiteSpace($paper.name)) {
    $paper.sitePath
  } else {
    $paper.name
  }

  if ([string]::IsNullOrWhiteSpace($paper.repository) -or [string]::IsNullOrWhiteSpace($paper.sourcePath) -or [string]::IsNullOrWhiteSpace($paper.sitePath)) {
    $message = "Manifest entry '$paperName' is enabled but is missing repository, sourcePath, or sitePath."

    if ($FailOnMissing) {
      throw $message
    }

    Write-Warning $message
    continue
  }

  $ref = if ([string]::IsNullOrWhiteSpace($paper.ref)) { "main" } else { $paper.ref }
  $encodedPath = Get-EncodedGitHubPath -Path $paper.sourcePath
  $encodedRef = [Uri]::EscapeDataString($ref)
  $downloadUrl = "https://api.github.com/repos/$($paper.repository)/contents/${encodedPath}?ref=${encodedRef}"
  $destinationPath = Join-Path $OutputRoot $paper.sitePath
  $destinationDirectory = Split-Path -Parent $destinationPath

  if (-not [string]::IsNullOrWhiteSpace($destinationDirectory) -and -not (Test-Path -LiteralPath $destinationDirectory)) {
    New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
  }

  try {
    Invoke-WebRequest -Uri $downloadUrl -Headers $headers -OutFile $destinationPath
    Write-Host "Synced '$paperName' from $($paper.repository)@$ref/$($paper.sourcePath) to $destinationPath"
  } catch {
    throw "Failed to sync '$paperName' from $($paper.repository)@$ref/$($paper.sourcePath): $($_.Exception.Message)"
  }
}
