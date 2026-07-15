import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import * as scanner from "../scripts/check-public-content.mjs";

const { findSensitiveContent } = scanner;

test("allows ordinary Chinese Markdown", () => {
	assert.deepEqual(findSensitiveContent("知识笔记\n\nCloudflare Pages 部署记录"), []);
});

test("rejects GitHub credential-like content without returning the value", () => {
	const secret = "ghp_abcdefghijklmnopqrstuvwxyz123456";
	const findings = findSensitiveContent(`GITHUB_TOKEN=${secret}`);

	assert.deepEqual(findings, ["GitHub token"]);
	assert.equal(findings.join(" ").includes(secret), false);
});

test("rejects configured secret assignments", () => {
	const findings = findSensitiveContent(
		"CLOUDFLARE_API_TOKEN=1234567890abcdefghijklmnopqrstuvwxyz",
	);

	assert.deepEqual(findings, ["secret assignment"]);
});

test("rejects private key material", () => {
	const findings = findSensitiveContent("-----BEGIN PRIVATE KEY-----");

	assert.deepEqual(findings, ["private key"]);
});

test("scans publishable text files without returning secret values", async () => {
	const root = await mkdtemp(path.join(tmpdir(), "public-content-"));
	const notes = path.join(root, "notes");
	const secret = "ghp_abcdefghijklmnopqrstuvwxyz123456";
	await mkdir(notes);
	await writeFile(path.join(notes, "safe.md"), "普通公开笔记", "utf8");
	await writeFile(path.join(notes, "unsafe.md"), `token=${secret}`, "utf8");

	assert.equal(typeof scanner.scanPublicContent, "function");
	const findings = await scanner.scanPublicContent([notes]);

	assert.deepEqual(findings, [{ file: path.join(notes, "unsafe.md"), rules: ["GitHub token"] }]);
	assert.equal(JSON.stringify(findings).includes(secret), false);
});
