import { execSync } from "child_process";
import { parse } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// === Load and parse .env ===
const envPath = resolve(__dirname, "../.env");

if (!existsSync(envPath)) {
  console.error("❌ No .env file found in project root!");
  process.exit(1);
}

const envFile = readFileSync(envPath, "utf-8");
const envVars = parse(envFile);

// === Get entries directly from parsed .env ===
const entries = Object.entries(envVars);

// Optional: skip non-secret keys (edit as needed)
const skipPatterns = [/^NODE_ENV$/, /_URL$/, /^STAGE$/, /^ENV$/];
const secrets = entries.filter(([key]) => !skipPatterns.some((re) => re.test(key)));

console.log(`🗝  Setting ${secrets.length} secrets from .env...\n`);

const stage = process.argv[2] || "prod";

for (const [key, value] of secrets) {
  if (!value) {
    console.warn(`⚠️  Skipping ${key} (no value set)`);
    continue;
  }

  try {
    console.log(`→ Setting secret ${key}...`);
    execSync(`sst secret set ${key} "${value}" --stage ${stage}`, {
      stdio: "inherit",
    });
  } catch (err: any) {
    console.error(`❌ Failed to set ${key}: ${err.message}`);
  }
}

console.log(`\n✅ Done! All secrets processed for stage "${stage}".`);
