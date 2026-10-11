import fs from "node:fs";

const source = fs.readFileSync("scripts/configure-main-ruleset.ps1", "utf8");

function expect(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS ${message}`);
}

expect(source.includes("[switch]$Apply"), "ruleset helper is dry-run by default and needs an explicit Apply switch");
expect(source.includes("ExpectedMainSha = \"a20c03ff9a84715772250a0daab6cd110d8235c2\""), "ruleset helper pins the reviewed main baseline before consolidation");
expect(source.includes("-AllowMainDrift deliberately"), "main drift requires an explicit override after re-audit");
expect(source.includes('include = @("refs/heads/main")'), "ruleset targets main only");
expect(source.includes('bypass_actors = @()'), "ruleset grants no bypass actor by default");
expect(source.includes('allowed_merge_methods = @("merge")'), "stack consolidation permits merge commits only");
expect(!source.includes('allowed_merge_methods = @("squash"'), "stack consolidation does not permit squash as its configured merge method");
expect(!source.includes('allowed_merge_methods = @("rebase"'), "stack consolidation does not permit rebase as its configured merge method");
expect(source.includes('type = "deletion"'), "main deletion is blocked");
expect(source.includes('type = "non_fast_forward"'), "force pushes are blocked");
expect(source.includes('required_review_thread_resolution = $true'), "review conversations must be resolved");
expect(source.includes('required_approving_review_count = 0'), "single-maintainer consolidation does not invent an unavailable reviewer requirement");
expect(source.includes('strict_required_status_checks_policy = $true'), "required checks must be current with main");
expect(source.includes('context = "Full contract · Node 22"'), "Node 22 full contract is required");
expect(source.includes('context = "Vercel runtime parity · Node 24"'), "Node 24 runtime parity is required");
expect((source.match(/integration_id = 15368/g) ?? []).length === 2, "both required checks are pinned to the GitHub Actions integration");
expect(!source.includes('context = "Vercel"'), "external Vercel deployment status is not a required check");
expect(source.includes("DRY RUN ONLY. No GitHub settings were changed."), "dry run makes the no-mutation state explicit");
expect(source.includes('if (-not $Apply)'), "POST path is gated behind explicit Apply");

if (process.exitCode) process.exit(process.exitCode);
console.log("MAIN RULESET HELPER CONTRACT GREEN");
