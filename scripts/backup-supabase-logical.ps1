param(
  [string]$OutputRoot = (Join-Path $PSScriptRoot "..\backups\supabase")
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Fail([string]$Message) {
  Write-Error $Message
  exit 1
}

function ConvertFrom-SecureStringPlain([Security.SecureString]$SecureValue) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Test-SupabaseDbUrl([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
  if ($Value.Length -gt 2048) { return $false }
  if ($Value -match '[\r\n\t]') { return $false }
  if ($Value -match '\s') { return $false }
  if ($Value -match '\[YOUR-PASSWORD\]') { return $false }

  $uri = $null
  if (-not [Uri]::TryCreate($Value, [UriKind]::Absolute, [ref]$uri)) { return $false }
  if ($uri.Scheme -notin @('postgres', 'postgresql')) { return $false }
  if ([string]::IsNullOrWhiteSpace($uri.UserInfo)) { return $false }
  if ([string]::IsNullOrWhiteSpace($uri.Host)) { return $false }
  if ($uri.Host -notmatch '(^|\.)supabase\.(co|com)$') { return $false }
  if ($uri.AbsolutePath -ne '/postgres') { return $false }

  return $true
}

if (-not (Test-Path Env:\SUPABASE_DB_URL)) {
  Write-Host "SUPABASE_DB_URL is not set." -ForegroundColor Yellow
  Write-Host "Paste only the Supabase Postgres connection URI at the hidden prompt below." -ForegroundColor Yellow
  Write-Host "The value will not be echoed and will not be written to PowerShell history." -ForegroundColor Yellow

  $secureUri = Read-Host "Supabase connection URI" -AsSecureString
  $candidateUri = ConvertFrom-SecureStringPlain $secureUri
  Remove-Variable secureUri -ErrorAction SilentlyContinue

  if ($candidateUri -match '\[YOUR-PASSWORD\]') {
    $securePassword = Read-Host "Database password" -AsSecureString
    $plainPassword = ConvertFrom-SecureStringPlain $securePassword
    Remove-Variable securePassword -ErrorAction SilentlyContinue

    try {
      $encodedPassword = [Uri]::EscapeDataString($plainPassword)
      $candidateUri = $candidateUri.Replace('[YOUR-PASSWORD]', $encodedPassword)
    } finally {
      Remove-Variable plainPassword -ErrorAction SilentlyContinue
      Remove-Variable encodedPassword -ErrorAction SilentlyContinue
    }
  }

  if (-not (Test-SupabaseDbUrl $candidateUri)) {
    Remove-Variable candidateUri -ErrorAction SilentlyContinue
    Fail "The supplied value is not a valid Supabase Postgres connection string. Paste only the URI shown by Supabase Connect (Session Pooler is recommended for IPv4-only networks)."
  }

  $env:SUPABASE_DB_URL = $candidateUri
  Remove-Variable candidateUri -ErrorAction SilentlyContinue
  Write-Host "SUPABASE_DB_URL loaded securely for this PowerShell process." -ForegroundColor Green
}

if (-not (Test-SupabaseDbUrl $env:SUPABASE_DB_URL)) {
  Fail "SUPABASE_DB_URL is present but is not a valid Supabase Postgres connection string. Clear it and rerun this script; the script can securely prompt for the URI."
}

$SupabaseMode = $null
if (Get-Command supabase -ErrorAction SilentlyContinue) {
  $SupabaseMode = "global"
} elseif (Get-Command npx -ErrorAction SilentlyContinue) {
  $SupabaseMode = "npx"
} else {
  Fail "Supabase CLI was not found and npx is unavailable. Install Node.js 20+ or a global Supabase CLI before running this backup."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Fail "Docker was not found in PATH. Current Supabase db dump uses Docker for the managed pg_dump image."
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Fail "Docker is installed but the engine is not available. Start Docker Desktop and retry."
}

function Invoke-SupabaseCli {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Operation,

    [Parameter(Mandatory = $true)]
    [string[]]$CommandArgs
  )

  if ($SupabaseMode -eq "global") {
    & supabase @CommandArgs
  } else {
    & npx --yes "supabase@latest" @CommandArgs
  }

  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    # Never echo CommandArgs here because they contain SUPABASE_DB_URL.
    Fail "Supabase CLI command failed during '$Operation' (exit code $exitCode)."
  }
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$out = Join-Path $OutputRoot $stamp
New-Item -ItemType Directory -Force -Path $out | Out-Null

$roles = Join-Path $out "roles.sql"
$schema = Join-Path $out "schema.sql"
$data = Join-Path $out "data.sql"
$manifest = Join-Path $out "manifest.sha256.txt"
$metadata = Join-Path $out "backup-metadata.txt"

Write-Host "ORBI LIVING - Supabase logical backup" -ForegroundColor Cyan
Write-Host "Output: $out"
Write-Host "Connection string is intentionally not printed."
Write-Host "Supabase CLI mode: $SupabaseMode"

Invoke-SupabaseCli -Operation "roles dump" -CommandArgs @(
  "db", "dump",
  "--db-url", $env:SUPABASE_DB_URL,
  "-f", $roles,
  "--role-only"
)

Invoke-SupabaseCli -Operation "schema dump" -CommandArgs @(
  "db", "dump",
  "--db-url", $env:SUPABASE_DB_URL,
  "-f", $schema
)

Invoke-SupabaseCli -Operation "data dump" -CommandArgs @(
  "db", "dump",
  "--db-url", $env:SUPABASE_DB_URL,
  "-f", $data,
  "--use-copy",
  "--data-only",
  "-x", "storage.buckets_vectors",
  "-x", "storage.vector_indexes"
)

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

if ($SupabaseMode -eq "global") {
  $supabaseVersion = (& supabase --version 2>$null | Select-Object -First 1)
} else {
  $supabaseVersion = (& npx --yes "supabase@latest" --version 2>$null | Select-Object -First 1)
}
$dockerVersion = (& docker --version 2>$null | Select-Object -First 1)
@(
  "created_local=$((Get-Date).ToString('o'))"
  "supabase_cli=$supabaseVersion"
  "supabase_mode=$SupabaseMode"
  "docker=$dockerVersion"
  "files=roles.sql,schema.sql,data.sql"
  "contains_real_data=REVIEW_BEFORE_STORAGE"
  "source_project_ref=RECORD_PRIVATELY"
  "operator=RECORD_PRIVATELY"
) | Set-Content -Encoding UTF8 $metadata

Write-Host "Backup files created and SHA-256 manifest written." -ForegroundColor Green
Write-Host "IMPORTANT: do not commit this directory. Move any real-data backup to approved encrypted off-site storage." -ForegroundColor Yellow
Write-Host "A backup is not considered proven until an independent restore drill succeeds." -ForegroundColor Yellow
