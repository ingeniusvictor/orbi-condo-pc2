param(
  [string]$OutputRoot = (Join-Path $PSScriptRoot "..\backups\supabase")
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Fail([string]$Message) {
  Write-Error $Message
  exit 1
}

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL)) {
  Fail "SUPABASE_DB_URL is not set. Obtain the Session Pooler connection string from Supabase Connect and set it only in this process environment."
}

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Fail "Supabase CLI was not found in PATH. Install it before running this backup."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Fail "Docker was not found in PATH. Current Supabase db dump uses Docker for the managed pg_dump image."
}

try {
  docker info *> $null
} catch {
  Fail "Docker is installed but the engine is not available. Start Docker Desktop and retry."
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$out = Join-Path $OutputRoot $stamp
New-Item -ItemType Directory -Force -Path $out | Out-Null

$roles = Join-Path $out "roles.sql"
$schema = Join-Path $out "schema.sql"
$data = Join-Path $out "data.sql"
$manifest = Join-Path $out "manifest.sha256.txt"
$metadata = Join-Path $out "backup-metadata.txt"

Write-Host "ORBI LIVING · Supabase logical backup" -ForegroundColor Cyan
Write-Host "Output: $out"
Write-Host "Connection string is intentionally not printed."

& supabase db dump --db-url $env:SUPABASE_DB_URL -f $roles --role-only
if ($LASTEXITCODE -ne 0) { Fail "Role dump failed." }

& supabase db dump --db-url $env:SUPABASE_DB_URL -f $schema
if ($LASTEXITCODE -ne 0) { Fail "Schema dump failed." }

& supabase db dump --db-url $env:SUPABASE_DB_URL -f $data --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
if ($LASTEXITCODE -ne 0) { Fail "Data dump failed." }

$files = @($roles, $schema, $data)
foreach ($file in $files) {
  if (-not (Test-Path $file)) { Fail "Expected backup file is missing: $file" }
  if ((Get-Item $file).Length -le 0) { Fail "Backup file is empty: $file" }
}

$hashLines = foreach ($file in $files) {
  $hash = Get-FileHash -Algorithm SHA256 -Path $file
  "{0}  {1}" -f $hash.Hash.ToLowerInvariant(), (Split-Path $file -Leaf)
}
$hashLines | Set-Content -Encoding UTF8 $manifest

$supabaseVersion = (& supabase --version 2>$null | Select-Object -First 1)
$dockerVersion = (& docker --version 2>$null | Select-Object -First 1)
@(
  "created_local=$((Get-Date).ToString('o'))"
  "supabase_cli=$supabaseVersion"
  "docker=$dockerVersion"
  "files=roles.sql,schema.sql,data.sql"
  "contains_real_data=REVIEW_BEFORE_STORAGE"
  "source_project_ref=RECORD_PRIVATELY"
  "operator=RECORD_PRIVATELY"
) | Set-Content -Encoding UTF8 $metadata

Write-Host "Backup files created and SHA-256 manifest written." -ForegroundColor Green
Write-Host "IMPORTANT: do not commit this directory. Move any real-data backup to approved encrypted off-site storage." -ForegroundColor Yellow
Write-Host "A backup is not considered proven until an independent restore drill succeeds." -ForegroundColor Yellow
