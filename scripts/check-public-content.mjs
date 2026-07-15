import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publishableExtensions = new Set([".md", ".mdx", ".json", ".txt", ".yaml", ".yml"]);

const sensitivePatterns = [
	{
		name: "private key",
		pattern: /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/i,
	},
	{
		name: "GitHub token",
		pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
	},
	{
		name: "OpenAI token",
		pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
	},
	{
		name: "secret assignment",
		pattern:
			/\b(?:CLOUDFLARE_API_TOKEN|OPENAI_API_KEY|API_SECRET|CLIENT_SECRET|PRIVATE_TOKEN|ACCESS_TOKEN)\s*[:=]\s*["']?[^\s"']{12,}/i,
	},
];

export function findSensitiveContent(text) {
	return sensitivePatterns.filter(({ pattern }) => pattern.test(text)).map(({ name }) => name);
}

async function collectTextFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectTextFiles(entryPath)));
		} else if (
			entry.isFile() &&
			publishableExtensions.has(path.extname(entry.name).toLowerCase())
		) {
			files.push(entryPath);
		}
	}

	return files;
}

export async function scanPublicContent(contentRoots) {
	const findings = [];

	for (const root of contentRoots) {
		let files;
		try {
			files = await collectTextFiles(root);
		} catch (error) {
			if (error?.code === "ENOENT") continue;
			throw error;
		}

		for (const file of files) {
			const rules = findSensitiveContent(await readFile(file, "utf8"));
			if (rules.length > 0) findings.push({ file, rules });
		}
	}

	return findings;
}

async function main() {
	const roots = ["content/posts", "content/notes", "content/tags"];
	const findings = await scanPublicContent(roots);

	if (findings.length === 0) {
		console.log("Public content safety check passed.");
		return;
	}

	console.error("Public content safety check failed:");
	for (const finding of findings) {
		console.error(`- ${finding.file}: ${finding.rules.join(", ")}`);
	}
	process.exitCode = 1;
}

const isDirectRun = process.argv[1]
	? path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
	: false;

if (isDirectRun) {
	main().catch((error) => {
		console.error(`Public content safety check could not run: ${error.message}`);
		process.exitCode = 1;
	});
}
