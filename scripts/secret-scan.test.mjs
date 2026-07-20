import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scanner = join(dirname(fileURLToPath(import.meta.url)), "secret-scan.mjs");

test("secret scan rejects a credential removed from the current tree but retained in Git history", () => {
  const repository = mkdtempSync(join(tmpdir(), "marketlens-secret-history-"));
  try {
    git(repository, ["init"]);
    git(repository, ["config", "user.name", "MarketLens Test"]);
    git(repository, ["config", "user.email", "test@local.invalid"]);
    writeFileSync(join(repository, "leaked.env"), `API_${"KEY"}=${"A".repeat(24)}\n`, "utf8");
    git(repository, ["add", "."]);
    git(repository, ["commit", "-m", "seed leaked credential"]);
    rmSync(join(repository, "leaked.env"));
    writeFileSync(join(repository, "README.md"), "clean tree\n", "utf8");
    git(repository, ["add", "-A"]);
    git(repository, ["commit", "-m", "remove leaked credential"]);

    const result = spawnSync(process.execPath, [scanner], { cwd: repository, encoding: "utf8" });
    assert.notEqual(result.status, 0, "scanner must fail when a secret remains in reachable Git history");
    assert.match(result.stderr, /Git history contains a potential secret/);
    assert.doesNotMatch(result.stderr, /A{20}/, "scanner must not print the secret value");
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

test("secret scan rejects a force-tracked local environment file even without credential-like content", () => {
  const repository = mkdtempSync(join(tmpdir(), "marketlens-secret-env-"));
  try {
    git(repository, ["init"]);
    writeFileSync(join(repository, ".gitignore"), ".env*\n!.env.example\n", "utf8");
    writeFileSync(join(repository, ".env.staging.local"), "MODE=preview\n", "utf8");
    git(repository, ["add", ".gitignore"]);
    git(repository, ["add", "-f", ".env.staging.local"]);

    const result = spawnSync(process.execPath, [scanner], { cwd: repository, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /forbidden environment file/);
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

test("secret scan allows an env example containing consecutive empty variables", () => {
  const repository = mkdtempSync(join(tmpdir(), "marketlens-secret-example-"));
  try {
    git(repository, ["init"]);
    writeFileSync(
      join(repository, ".env.example"),
      "TWELVE_DATA_API_KEY=\nFINNHUB_API_KEY=\nGEMINI_API_KEY=\n",
      "utf8",
    );
    git(repository, ["add", ".env.example"]);

    const result = spawnSync(process.execPath, [scanner], { cwd: repository, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

test("secret scan inspects package-lock.json instead of treating it as generated noise", () => {
  const repository = mkdtempSync(join(tmpdir(), "marketlens-secret-lock-"));
  try {
    git(repository, ["init"]);
    const credentialField = `pass${"word"}`;
    writeFileSync(
      join(repository, "package-lock.json"),
      JSON.stringify({ [credentialField]: "credential-value-that-must-fail" }),
      "utf8",
    );
    git(repository, ["add", "package-lock.json"]);

    const result = spawnSync(process.execPath, [scanner], { cwd: repository, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Assigned credential/);
    assert.doesNotMatch(result.stderr, /credential-value-that-must-fail/);
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

function git(cwd, args) {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}
