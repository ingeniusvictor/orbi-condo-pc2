param(
    [switch]$Apply,
    [ValidateSet("Consolidation", "Final")]
    [string]$Mode = "Consolidation",
    [string]$Repository = "ingeniusvictor/orbi-condo-pc2",
    [string]$RulesetName = "ORBI LIVING - protect main",
    [string]$ExpectedMainSha = "a20c03ff9a84715772250a0daab6cd110d8235c2",
    [switch]$AllowMainDrift
)

$ErrorActionPreference = "Stop"

function Invoke-GhJson {
    param([Parameter(Mandatory = $true)][string]$Path)
    $raw = & gh api `
        -H "Accept: application/vnd.github+json" `
        -H "X-GitHub-Api-Version: 2026-03-10" `
        $Path
    if ($LASTEXITCODE -ne 0) {
        throw "gh api failed for $Path"
    }
    return $raw | ConvertFrom-Json
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) is required. Install it and authenticate before running this helper."
}

& gh auth status 1>$null
if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI is not authenticated. Run 'gh auth login' first."
}

$repoInfo = Invoke-GhJson -Path "repos/$Repository"
if ($repoInfo.full_name -ne $Repository) {
    throw "Repository verification failed. Expected $Repository but GitHub returned $($repoInfo.full_name)."
}
if ($repoInfo.default_branch -ne "main") {
    throw "Default branch is '$($repoInfo.default_branch)', not 'main'. Refusing to configure this ruleset."
}

$mainInfo = Invoke-GhJson -Path "repos/$Repository/branches/main"
$currentMainSha = [string]$mainInfo.commit.sha
if (-not $AllowMainDrift -and $currentMainSha -ne $ExpectedMainSha) {
    throw "main moved from the reviewed baseline. Expected $ExpectedMainSha, found $currentMainSha. Re-audit before applying or use -AllowMainDrift deliberately."
}

$currentRulesets = @(Invoke-GhJson -Path "repos/$Repository/rulesets?includes_parents=true")
$matchingRulesets = @($currentRulesets | Where-Object {
    $_.source_type -eq "Repository" -and
    $_.source -eq $Repository -and
    $_.target -eq "branch" -and
    ($_.name -eq $RulesetName -or $_.name -like "ORBI LIVING*protect main")
})
if ($matchingRulesets.Count -gt 1) {
    throw "Multiple ORBI LIVING main-protection rulesets exist. Refusing to choose one automatically."
}
$existingRuleset = if ($matchingRulesets.Count -eq 1) { $matchingRulesets[0] } else { $null }

$rules = @(
    [ordered]@{ type = "deletion" },
    [ordered]@{ type = "non_fast_forward" },
    [ordered]@{
        type = "pull_request"
        parameters = [ordered]@{
            allowed_merge_methods = @("merge")
            dismiss_stale_reviews_on_push = $false
            require_code_owner_review = $false
            require_last_push_approval = $false
            required_approving_review_count = 0
            required_review_thread_resolution = $true
        }
    }
)

if ($Mode -eq "Final") {
    $rules += [ordered]@{
        type = "required_status_checks"
        parameters = [ordered]@{
            do_not_enforce_on_create = $false
            strict_required_status_checks_policy = $true
            required_status_checks = @(
                [ordered]@{
                    context = "Full contract - Node 22"
                    integration_id = 15368
                },
                [ordered]@{
                    context = "Vercel runtime parity - Node 24"
                    integration_id = 15368
                }
            )
        }
    }
}

$payload = [ordered]@{
    name = $RulesetName
    target = "branch"
    enforcement = "active"
    bypass_actors = @()
    conditions = [ordered]@{
        ref_name = [ordered]@{
            include = @("refs/heads/main")
            exclude = @()
        }
    }
    rules = $rules
}

$json = $payload | ConvertTo-Json -Depth 12

Write-Host "Repository: $Repository"
Write-Host "main SHA:   $currentMainSha"
Write-Host "Ruleset:    $RulesetName"
Write-Host "Mode:       $Mode"
Write-Host "Merge method during stacked consolidation: merge commit only"
Write-Host "External Vercel deployment status is intentionally NOT required."
if ($Mode -eq "Consolidation") {
    Write-Host "Required checks: none during historical stacked consolidation."
    Write-Host "Each PR Quality Gate must be verified manually before its merge."
} else {
    Write-Host "Required checks after final stack consolidation:"
    Write-Host "  - Full contract - Node 22 (GitHub Actions app 15368)"
    Write-Host "  - Vercel runtime parity - Node 24 (GitHub Actions app 15368)"
}

$operation = if ($existingRuleset) { "UPDATE ruleset id $($existingRuleset.id)" } else { "CREATE ruleset" }
Write-Host "Operation:  $operation"

if (-not $Apply) {
    Write-Host ""
    Write-Host "DRY RUN ONLY. No GitHub settings were changed."
    Write-Host "Review the payload below, then re-run with -Apply if correct:"
    Write-Output $json
    exit 0
}

$tempPath = Join-Path ([System.IO.Path]::GetTempPath()) ("orbi-main-ruleset-" + [guid]::NewGuid().ToString("N") + ".json")
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
try {
    [System.IO.File]::WriteAllText($tempPath, $json, $utf8NoBom)

    if ($existingRuleset) {
        Write-Host ""
        Write-Host "Updating existing repository ruleset..."
        & gh api `
            --method PUT `
            -H "Accept: application/vnd.github+json" `
            -H "X-GitHub-Api-Version: 2026-03-10" `
            "repos/$Repository/rulesets/$($existingRuleset.id)" `
            --input $tempPath
    } else {
        Write-Host ""
        Write-Host "Creating repository ruleset..."
        & gh api `
            --method POST `
            -H "Accept: application/vnd.github+json" `
            -H "X-GitHub-Api-Version: 2026-03-10" `
            "repos/$Repository/rulesets" `
            --input $tempPath
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Ruleset write failed. No merge sequence should start until protection is verified."
    }
} finally {
    if (Test-Path $tempPath) {
        Remove-Item -Force $tempPath
    }
}

Write-Host "Ruleset write request succeeded. Verify the effective ruleset before any merge."
