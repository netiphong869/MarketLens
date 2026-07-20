import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const binaryExtensions = /\.(?:png|jpe?g|gif|webp|ico|zip|gz|pdf|woff2?|ttf|eot|mp4|webm)$/i;
const patterns = [
  { name: "Google API key", regex: /AIza[0-9A-Za-z_-]{30,}/g },
  { name: "OpenAI-style key", regex: /sk-[A-Za-z0-9_-]{20,}/g },
  { name: "GitHub token", regex: /gh[oprsu]_[A-Za-z0-9]{20,}/g },
  { name: "AWS access key", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "Stripe live secret", regex: /sk_live_[0-9A-Za-z]{16,}/g },
  { name: "Private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  {
    name: "Assigned credential",
    regex:
      /["']?(?:API_KEY|ACCESS_TOKEN|AUTH_TOKEN|PASSWORD|PASSWD|CLIENT_SECRET|SIGNING_SECRET|TOKEN|SECRET)["']?[ \t]*[:=][ \t]*["']?[A-Za-z0-9_./+\-=]{12,}["']?/gi,
  },
];

const currentFiles = listCurrentFiles();
const findings = new Set();
let inspectedCurrentFiles = 0;

for (const file of currentFiles) {
  if (isForbiddenEnvironmentFile(file)) {
    findings.add(`${file}: forbidden environment file`);
  }
  if (!existsSync(file)) continue;
  inspectedCurrentFiles += 1;
  scanContent(decodeFile(readFileSync(file), file), file, findings);
}

const commits = listCommits();
let inspectedHistoryBlobs = 0;
for (const commit of commits) {
  for (const file of listCommitFiles(commit)) {
    const location = `${commit.slice(0, 12)}:${file}`;
    if (isForbiddenEnvironmentFile(file)) {
      findings.add(`${location}: forbidden environment file in Git history`);
    }
    const blob = readCommitFile(commit, file);
    if (blob === null) continue;
    inspectedHistoryBlobs += 1;
    scanContent(decodeFile(blob, file), location, findings, true);
  }
}

if (findings.size > 0) {
  console.error([...findings].join("\n"));
  process.exit(1);
}

console.log(
  `Secret scan passed (${inspectedCurrentFiles} current files, ${commits.length} commits, ${inspectedHistoryBlobs} history blobs inspected).`,
);

function listCurrentFiles() {
  return git(["ls-files", "--cached", "--others", "--exclude-standard"])
    .split(/\r?\n/)
    .filter(Boolean);
}

function listCommits() {
  const result = spawnSync("git", ["rev-list", "--all"], { encoding: "utf8" });
  if (result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function listCommitFiles(commit) {
  return git(["ls-tree", "-r", "--name-only", commit])
    .split(/\r?\n/)
    .filter(Boolean);
}

function readCommitFile(commit, file) {
  const result = spawnSync("git", ["show", `${commit}:${file}`], {
    maxBuffer: 10 * 1024 * 1024,
  });
  return result.status === 0 ? result.stdout : null;
}

function scanContent(content, location, output, history = false) {
  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(content)) {
      output.add(
        history
          ? `${location}: Git history contains a potential secret (${pattern.name})`
          : `${location}: potential secret (${pattern.name})`,
      );
    }
  }
}

function isForbiddenEnvironmentFile(file) {
  const normalized = file.replaceAll("\\", "/");
  const name = normalized.split("/").at(-1) ?? "";
  return name.startsWith(".env") && name !== ".env.example";
}

function decodeFile(content, file) {
  return content.toString(binaryExtensions.test(file) ? "latin1" : "utf8");
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}
