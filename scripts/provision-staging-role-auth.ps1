[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("mayordomo", "concierge")]
    [string]$Role,

    [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRef = "drqjpzydgihrrdnkhewh"
$BaseUrl = "https://drqjpzydgihrrdnkhewh.supabase.co"
$CommunityId = "pc2"
$QaScope = "synthetic-staging-pc2"
$ServerUserAgent = "orbi-pc2-staging-auth-provisioner/1.1"

$RoleConfig = @{
    mayordomo = @{
        PlaceholderId = "00000000-0000-4000-8000-000000000102"
        PlaceholderEmail = "mayordomo.pc2@orbi.invalid"
        TargetEmail = "qa-mayordomo-pc2@example.com"
        GitHubEmailSecret = "ORBI_QA_MAYORDOMO_EMAIL"
        GitHubPasswordSecret = "ORBI_QA_MAYORDOMO_PASSWORD"
    }
    concierge = @{
        PlaceholderId = "00000000-0000-4000-8000-000000000103"
        PlaceholderEmail = "concierge.pc2@orbi.invalid"
        TargetEmail = "qa-concierge-pc2@example.com"
        GitHubEmailSecret = "ORBI_QA_CONCIERGE_EMAIL"
        GitHubPasswordSecret = "ORBI_QA_CONCIERGE_PASSWORD"
    }
}

$config = $RoleConfig[$Role]

function Convert-SecureValueToPlainText {
    param([Parameter(Mandatory = $true)][Security.SecureString]$Value)

    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

function New-ServiceHeaders {
    param([Parameter(Mandatory = $true)][string]$Key)

    $headers = @{
        apikey = $Key
        Accept = "application/json"
    }

    if ($Key.StartsWith("sb_secret_")) {
        # New Supabase opaque secret keys belong only in the apikey header.
        # The Supabase gateway translates them to service_role internally.
        return $headers
    }

    $jwtParts = @($Key.Split('.'))
    if ($jwtParts.Count -eq 3) {
        # Legacy service_role API keys are JWTs and remain compatible with Bearer auth.
        $headers["Authorization"] = "Bearer $Key"
        return $headers
    }

    throw "Unsupported staging Auth Admin key format. Use an sb_secret_ key or the legacy service_role JWT from this staging project."
}

function Invoke-OrbiStagingRequest {
    param(
        [Parameter(Mandatory = $true)][ValidateSet("GET", "POST", "PATCH", "PUT", "DELETE")][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][hashtable]$Headers,
        [object]$Body = $null
    )

    if (-not $Path.StartsWith("/")) {
        throw "Refusing a non-relative staging API path."
    }

    $uri = "$BaseUrl$Path"
    $parameters = @{
        Uri = $uri
        Method = $Method
        Headers = $Headers
        UserAgent = $ServerUserAgent
        ErrorAction = "Stop"
    }

    if ($null -ne $Body) {
        $parameters["ContentType"] = "application/json"
        $parameters["Body"] = $Body | ConvertTo-Json -Depth 8 -Compress
    }

    return Invoke-RestMethod @parameters
}

function Get-AdminUsers {
    param([Parameter(Mandatory = $true)][hashtable]$Headers)

    $response = Invoke-OrbiStagingRequest -Method GET -Path "/auth/v1/admin/users?page=1&per_page=1000" -Headers $Headers
    if ($response -is [Array]) {
        return @($response)
    }
    if ($response.PSObject.Properties.Name -contains "users") {
        return @($response.users)
    }
    throw "Unexpected Auth Admin user-list response."
}

function Find-ExactlyOneUserByEmail {
    param(
        [Parameter(Mandatory = $true)][object[]]$Users,
        [Parameter(Mandatory = $true)][string]$Email,
        [switch]$AllowMissing
    )

    $matches = @($Users | Where-Object { $_.email -eq $Email })
    if ($matches.Count -gt 1) {
        throw "More than one staging Auth user matched the expected synthetic email."
    }
    if ($matches.Count -eq 0) {
        if ($AllowMissing) { return $null }
        throw "Expected staging Auth placeholder was not found."
    }
    return $matches[0]
}

function Get-RoleMemberships {
    param([Parameter(Mandatory = $true)][hashtable]$Headers)

    $path = "/rest/v1/memberships?community_id=eq.$CommunityId&operations_role=eq.$Role&select=user_id,community_id,operations_role,active_from,active_until,disabled_at"
    return @(Invoke-OrbiStagingRequest -Method GET -Path $path -Headers $Headers)
}

function Test-MembershipActive {
    param([Parameter(Mandatory = $true)][object]$Membership)

    $now = [DateTimeOffset]::UtcNow
    if ($null -ne $Membership.disabled_at -and [string]$Membership.disabled_at -ne "") { return $false }
    if ($null -ne $Membership.active_from -and [string]$Membership.active_from -ne "") {
        if ([DateTimeOffset]::Parse([string]$Membership.active_from) -gt $now) { return $false }
    }
    if ($null -ne $Membership.active_until -and [string]$Membership.active_until -ne "") {
        if ([DateTimeOffset]::Parse([string]$Membership.active_until) -lt $now) { return $false }
    }
    return $true
}

function Get-ExactActiveRoleMembership {
    param([Parameter(Mandatory = $true)][hashtable]$Headers)

    $active = @(Get-RoleMemberships -Headers $Headers | Where-Object { Test-MembershipActive $_ })
    if ($active.Count -ne 1) {
        throw "Expected exactly one active synthetic membership for role '$Role' in community '$CommunityId'; found $($active.Count)."
    }
    return $active[0]
}

function Set-MembershipUserId {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Headers,
        [Parameter(Mandatory = $true)][string]$FromUserId,
        [Parameter(Mandatory = $true)][string]$ToUserId
    )

    $patchHeaders = @{}
    foreach ($entry in $Headers.GetEnumerator()) { $patchHeaders[$entry.Key] = $entry.Value }
    $patchHeaders["Prefer"] = "return=representation"

    $path = "/rest/v1/memberships?user_id=eq.$FromUserId&community_id=eq.$CommunityId&operations_role=eq.$Role"
    $changed = @(Invoke-OrbiStagingRequest -Method PATCH -Path $path -Headers $patchHeaders -Body @{ user_id = $ToUserId })
    if ($changed.Count -ne 1 -or [string]$changed[0].user_id -ne $ToUserId) {
        throw "Synthetic membership reassignment did not return exactly one expected row."
    }
}

function Remove-AuthUserQuietly {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Headers,
        [Parameter(Mandatory = $true)][string]$UserId
    )

    try {
        $null = Invoke-OrbiStagingRequest -Method DELETE -Path "/auth/v1/admin/users/$UserId" -Headers $Headers
    }
    catch {
        Write-Warning "QA rollback warning: newly-created synthetic Auth user could not be removed automatically. Review staging before retrying."
    }
}

Write-Host "ORBI LIVING staging role Auth provisioner"
Write-Host "Project ref : $ProjectRef"
Write-Host "Community   : $CommunityId"
Write-Host "Role        : $Role"
Write-Host "Target email: $($config.TargetEmail)"
Write-Host "Mode        : $(if ($Apply) { 'APPLY' } else { 'DRY-RUN' })"

if (-not $Apply) {
    Write-Host "DRY-RUN: no network request or mutation was performed."
    Write-Host "Apply only against the pinned synthetic staging project with:"
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/provision-staging-role-auth.ps1 -Role $Role -Apply"
    exit 0
}

$serviceKeySecure = Read-Host "Supabase staging secret/service key (input hidden)" -AsSecureString
$passwordSecure = Read-Host "Password for the $Role synthetic QA account (input hidden)" -AsSecureString
$serviceKey = $null
$password = $null
$newUserId = $null
$userWasCreated = $false
$membershipWasMoved = $false
$adminHeaders = $null

try {
    $serviceKey = Convert-SecureValueToPlainText $serviceKeySecure
    $password = Convert-SecureValueToPlainText $passwordSecure

    if ([string]::IsNullOrWhiteSpace($serviceKey) -or $serviceKey.Length -lt 20) {
        throw "A valid staging Auth Admin key is required."
    }
    if ([string]::IsNullOrWhiteSpace($password) -or $password.Length -lt 20) {
        throw "Synthetic QA password must be at least 20 characters."
    }

    $adminHeaders = New-ServiceHeaders -Key $serviceKey

    $users = Get-AdminUsers -Headers $adminHeaders
    $placeholder = Find-ExactlyOneUserByEmail -Users $users -Email $config.PlaceholderEmail
    if ([string]$placeholder.id -ne $config.PlaceholderId) {
        throw "Synthetic placeholder identity does not match the pinned staging fixture."
    }

    $target = Find-ExactlyOneUserByEmail -Users $users -Email $config.TargetEmail -AllowMissing
    $membership = Get-ExactActiveRoleMembership -Headers $adminHeaders

    $allowedMembershipOwners = @($config.PlaceholderId)
    if ($null -ne $target) { $allowedMembershipOwners += [string]$target.id }
    if ($allowedMembershipOwners -notcontains [string]$membership.user_id) {
        throw "Active role membership belongs to an unexpected user; refusing to modify staging."
    }

    if ($null -eq $target) {
        $created = Invoke-OrbiStagingRequest -Method POST -Path "/auth/v1/admin/users" -Headers $adminHeaders -Body @{
            email = $config.TargetEmail
            password = $password
            email_confirm = $true
            user_metadata = @{
                qa_role = $Role
                qa_scope = $QaScope
            }
        }
        if ($null -eq $created.id) {
            throw "Auth Admin did not return the created synthetic user id."
        }
        $target = $created
        $newUserId = [string]$created.id
        $userWasCreated = $true
        Write-Host "PASS supported Auth Admin user creation + email confirmation"
    }
    else {
        $null = Invoke-OrbiStagingRequest -Method PUT -Path "/auth/v1/admin/users/$($target.id)" -Headers $adminHeaders -Body @{
            password = $password
            email_confirm = $true
            user_metadata = @{
                qa_role = $Role
                qa_scope = $QaScope
            }
        }
        $newUserId = [string]$target.id
        Write-Host "PASS supported Auth Admin user refresh + email confirmation"
    }

    if ([string]$membership.user_id -eq $config.PlaceholderId) {
        Set-MembershipUserId -Headers $adminHeaders -FromUserId $config.PlaceholderId -ToUserId $newUserId
        $membershipWasMoved = $true
        Write-Host "PASS synthetic membership reassigned to supported Auth identity"
    }
    elseif ([string]$membership.user_id -eq $newUserId) {
        Write-Host "PASS synthetic membership already points to supported Auth identity"
    }
    else {
        throw "Membership state changed unexpectedly during provisioning."
    }

    $verifiedMembership = Get-ExactActiveRoleMembership -Headers $adminHeaders
    if ([string]$verifiedMembership.user_id -ne $newUserId) {
        throw "Post-change membership verification failed."
    }
    Write-Host "PASS active role membership verified"

    $loginHeaders = New-ServiceHeaders -Key $serviceKey
    $login = Invoke-OrbiStagingRequest -Method POST -Path "/auth/v1/token?grant_type=password" -Headers $loginHeaders -Body @{
        email = $config.TargetEmail
        password = $password
    }
    if ($null -eq $login.access_token -or $null -eq $login.user -or [string]$login.user.id -ne $newUserId) {
        throw "Password sign-in did not resolve the provisioned synthetic identity."
    }
    Write-Host "PASS password sign-in verified without exposing tokens"

    $logoutHeaders = @{
        apikey = $serviceKey
        Authorization = "Bearer $($login.access_token)"
    }
    $null = Invoke-OrbiStagingRequest -Method POST -Path "/auth/v1/logout" -Headers $logoutHeaders
    Write-Host "PASS verification session logged out"

    Write-Host "STAGING ROLE AUTH PROVISIONING GREEN"
    Write-Host "Set GitHub Actions secret $($config.GitHubEmailSecret) to the target email shown above."
    Write-Host "Set GitHub Actions secret $($config.GitHubPasswordSecret) to the same password you entered locally."
    Write-Host "Never paste the password or staging Auth Admin key into chat, issues, PRs, repository files or Vercel environment variables."
}
catch {
    if ($membershipWasMoved -and $null -ne $newUserId -and $null -ne $adminHeaders) {
        try {
            Set-MembershipUserId -Headers $adminHeaders -FromUserId $newUserId -ToUserId $config.PlaceholderId
            Write-Warning "QA rollback: synthetic membership restored to the inert placeholder."
            $membershipWasMoved = $false
        }
        catch {
            Write-Warning "QA rollback warning: membership restoration failed. Stop and review staging manually before any retry."
        }
    }
    if ($userWasCreated -and $null -ne $newUserId -and -not $membershipWasMoved -and $null -ne $adminHeaders) {
        Remove-AuthUserQuietly -Headers $adminHeaders -UserId $newUserId
    }
    throw
}
finally {
    $serviceKey = $null
    $password = $null
    $serviceKeySecure = $null
    $passwordSecure = $null
    $adminHeaders = $null
}
