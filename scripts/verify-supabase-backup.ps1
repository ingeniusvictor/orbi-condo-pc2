param(
  [Parameter(Mandatory=$true)]
  [string]$BackupDirectory
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Fail([string]$Message) {
  Write-Error $Message
  exit 1
}

$dir = (Resolve-Path $BackupDirectory -ErrorAction Stop).Path
$required = @("roles.sql","schema.sql","data.sql","manifest.sha256.txt","backup-metadata.txt")
foreach ($name in $required) {
  $path = Join-Path $dir $name
  if (-not (Test-Path $path -PathType Leaf)) { Fail "Missing backup artifact: $name" }
  if ((Get-Item $path).Length -le 0) { Fail "Backup artifact is empty: $name" }
}

$manifestPath = Join-Path $dir "manifest.sha256.txt"
$lines = Get-Content $manifestPath | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
if ($lines.Count -ne 3) { Fail "Manifest must contain exactly three hashed dump files." }

$expectedNames = @("roles.sql","schema.sql","data.sql")
$seen = @{}
foreach ($line in $lines) {
  if ($line -notmatch '^([0-9a-fA-F]{64})\s{2}(.+)$') { Fail "Invalid manifest line: $line" }
  $expectedHash = $Matches[1].ToLowerInvariant()
  $name = $Matches[2].Trim()
  if ($expectedNames -notcontains $name) { Fail "Unexpected file in manifest: $name" }
  if ($seen.ContainsKey($name)) { Fail "Duplicate manifest entry: $name" }
  $seen[$name] = $true
  $file = Join-Path $dir $name
  $actualHash = (Get-FileHash -Algorithm SHA256 -Path $file).Hash.ToLowerInvariant()
  if ($actualHash -ne $expectedHash) { Fail "SHA-256 mismatch: $name" }
}

foreach ($name in $expectedNames) {
  if (-not $seen.ContainsKey($name)) { Fail "Manifest does not include: $name" }
}

$metadataPath = Join-Path $dir "backup-metadata.txt"
$metadata = Get-Content $metadataPath -Raw
if ($metadata -notmatch '(?m)^created_local=.+$') { Fail "Backup metadata has no creation timestamp." }
if ($metadata -notmatch '(?m)^supabase_cli=.+$') { Fail "Backup metadata has no Supabase CLI version." }

Write-Host "ORBI LIVING backup integrity: PASS" -ForegroundColor Green
Write-Host "Directory: $dir"
Write-Host "Files, non-empty checks and SHA-256 manifest are consistent."
Write-Host "NOTE: Integrity PASS does not prove restorability. The independent restore drill is still required." -ForegroundColor Yellow
