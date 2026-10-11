import fs from "node:fs";

const source = fs.readFileSync("scripts/configure-main-ruleset.ps1", "utf8");
const workflow = fs.readFileSync(".github/workflows/quality.yml", "utf8");

function expect(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS ${message}`);
}

expect(source.includes("[switch]$Apply"), "ruleset helper remains dry-run by default");
expect(source.includes('[ValidateSet("Consolidation", "Final")]'), "ruleset helper exposes explicit consolidation and final modes");
expect(source.includes('[string]$Mode = "Consolidation"'), "historical stack protection defaults to consolidation mode");
expect(source.includes("ExpectedMainSha = \"a20c03ff9a84715772250a0daab6cd110d8235c2\""), "ruleset helper pins the reviewed main baseline before consolidation");
expect(source.includes("-AllowMainDrift deliberately"), "main drift requires an explicit override after re-audit");
expect(source.includes('include = @("refs/heads/main")'), "ruleset targets main only");
expect(source.includes('bypass_actors = @()'), "ruleset grants no bypass actor by default");
expect(source.includes('allowed_merge_methods = @("merge")'), "stack consolidation permits merge commits only");
expect(source.includes('type = "deletion"'), "main deletion is blocked");
expect(source.includes('type = "non_fast_forward"'), "force pushes are blocked");
expect(source.includes('required_review_thread_resolution = $true'), "review conversations must be resolved");
expect(source.includes('required_approving_review_count = 0'), "single-maintainer consolidation does not invent an unavailable reviewer requirement");
expect(source.includes('if ($Mode -eq "Final")'), "required status checks are deferred until final mode");
expect(source.includes('context = "Full contract - Node 22"'), "final Node 22 check name is ASCII stable");
expect(source.includes('context = "Vercel runtime parity - Node 24"'), "final Node 24 check name is ASCII stable");
expect((source.match(/integration_id = 15368/g) ?? []).length === 2, "both final required checks are pinned to GitHub Actions");
expect(!source.includes('context = "Vercel"'), "external Vercel deployment status is never required");
expect(source.includes('$_\.name -like "ORBI LIVING*protect main"') || source.includes('$_.name -like "ORBI LIVING*protect main"'), "helper discovers the previously-created ruleset even if its display name was mojibaked");
expect(source.includes('if ($existingRuleset)'), "helper updates an existing ruleset instead of creating a duplicate");
expect(source.includes('--method PUT'), "existing ruleset path uses PUT");
expect(source.includes('--method POST'), "missing ruleset path can still create once");
expect(source.includes('[System.IO.File]::WriteAllText'), "JSON payload is written through explicit UTF-8 file IO");
expect(source.includes('New-Object System.Text.UTF8Encoding($false)'), "PowerShell 5.1 writes JSON as UTF-8 without BOM");
expect(source.includes("DRY RUN ONLY. No GitHub settings were changed."), "dry run makes the no-mutation state explicit");
expect(workflow.includes("name: Full contract - Node 22"), "workflow emits ASCII Node 22 final check name");
expect(workflow.includes("name: Vercel runtime parity - Node 24"), "workflow emits ASCII Node 24 final check name");
expect(!workflow.includes("Full contract · Node 22") && !workflow.includes("Vercel runtime parity · Node 24"), "workflow no longer depends on middle-dot encoding");

if (process.exitCode) process.exit(process.exitCode);
console.log("MAIN RULESET HELPER CONTRACT GREEN");
