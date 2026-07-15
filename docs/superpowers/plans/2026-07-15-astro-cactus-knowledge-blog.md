# Astro Cactus Knowledge Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, and deploy a Chinese-first Astro Cactus knowledge blog named “逍遥哥的知识库” to Cloudflare Pages.

**Architecture:** Use the current Astro Cactus release as a static Astro application with separate post, note, and tag content collections. Keep all publishable content in the blog repository, add a fail-closed public-content scanner before builds, generate Pagefind search after Astro output, and deploy `dist` as Cloudflare static assets.

**Tech Stack:** Astro 7, TypeScript, Tailwind CSS 4, Pagefind, Node test runner, Wrangler, Cloudflare Pages/static assets, Playwright browser QA.

---

## File Map

- `package.json`: project identity, content-safety test, and build commands.
- `src/site.config.ts`: site title, description, locale, date formatting, and navigation behavior.
- `src/content.config.ts`: post, note, and tag frontmatter schemas supplied by Cactus.
- `src/components/*`, `src/pages/*`, `src/layouts/*`: existing Cactus UI, localized only where visible English remains.
- `content/post/hello-knowledge-base.md`: real introductory article.
- `content/note/github-notes-workflow.md`: real public-note workflow example.
- `content/tag/*.md`: Chinese tag landing copy.
- `scripts/check-public-content.mjs`: fail-closed scan of publishable Markdown and environment-like files.
- `tests/check-public-content.test.mjs`: scanner regression tests.
- `wrangler.jsonc`: Cloudflare static asset deployment configuration.
- `public/icon.svg`, `public/social-card.png`: retained or customized Cactus brand assets.
- `docs/superpowers/specs/*`, `docs/superpowers/plans/*`: approved project design and execution record.

### Task 1: Scaffold the pinned Cactus release

**Files:**
- Create: Astro Cactus application files at repository root
- Preserve: `docs/superpowers/specs/2026-07-15-astro-cactus-knowledge-blog-design.md`
- Preserve: `docs/superpowers/plans/2026-07-15-astro-cactus-knowledge-blog.md`

- [ ] **Step 1: Confirm release and runtime prerequisites**

Run:

```powershell
git ls-remote --tags https://github.com/chrismwilliams/astro-theme-cactus.git refs/tags/v8.2.0
node --version
pnpm --version
```

Expected: the tag resolves to a commit, Node satisfies the template engine requirement, and pnpm is available.

- [ ] **Step 2: Clone the template into the temporary work directory**

Run:

```powershell
git clone --depth 1 --branch v8.2.0 https://github.com/chrismwilliams/astro-theme-cactus.git work/astro-cactus-template
```

Expected: `work/astro-cactus-template/package.json` exists and no nested template `.git` directory is copied into the product root.

- [ ] **Step 3: Copy the release files into the project root**

Copy every template file except `.git`, then verify that the existing `docs/superpowers` files remain present.

Expected: `package.json`, `src`, `content`, and `public` exist at the root; the approved spec and plan are unchanged.

- [ ] **Step 4: Commit the baseline scaffold**

```powershell
git add .
git commit -m "chore: scaffold Astro Cactus blog"
```

### Task 2: Establish a clean baseline

**Files:**
- Modify only lockfile metadata if the package manager requires it

- [ ] **Step 1: Install pinned dependencies**

Run: `pnpm install --frozen-lockfile`

Expected: installation succeeds without changing dependency versions.

- [ ] **Step 2: Run the template checks**

Run: `pnpm check`

Expected: Astro and Biome checks exit with code 0.

- [ ] **Step 3: Build the untouched template**

Run: `pnpm build`

Expected: Astro generates `dist`, then Pagefind indexes the site without errors.

### Task 3: Add public-content safety checks with TDD

**Files:**
- Create: `scripts/check-public-content.mjs`
- Create: `tests/check-public-content.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing scanner tests**

The tests must create temporary publishable content and assert:

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { findSensitiveContent } from "../scripts/check-public-content.mjs";

test("allows ordinary Chinese Markdown", () => {
  assert.deepEqual(findSensitiveContent("知识笔记\n\nCloudflare Pages 部署记录"), []);
});

test("rejects credential-like content", () => {
  const findings = findSensitiveContent("GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz123456");
  assert.equal(findings.length, 1);
});

test("rejects private key material", () => {
  const findings = findSensitiveContent("-----BEGIN PRIVATE KEY-----");
  assert.equal(findings.length, 1);
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `node --test tests/check-public-content.test.mjs`

Expected: FAIL because `scripts/check-public-content.mjs` does not exist.

- [ ] **Step 3: Implement the scanner and CLI**

Export `findSensitiveContent(text)` and recursively scan `content/post`, `content/note`, and `content/tag`. Match private-key headers plus common GitHub, Cloudflare, OpenAI, and generic secret assignments; report file and rule names without printing secret values.

- [ ] **Step 4: Add safety commands to package scripts**

Add:

```json
{
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "check:content": "node scripts/check-public-content.mjs",
    "prebuild": "pnpm check:content"
  }
}
```

Preserve every existing Cactus script.

- [ ] **Step 5: Verify scanner and build integration**

Run:

```powershell
pnpm test
pnpm check:content
```

Expected: all three tests pass and publishable content scan exits with code 0.

- [ ] **Step 6: Commit the safety gate**

```powershell
git add package.json scripts tests
git commit -m "test: block sensitive public content"
```

### Task 4: Localize and brand the blog

**Files:**
- Modify: `package.json`
- Modify: `src/site.config.ts`
- Modify: visible-copy files found under `src/components`, `src/pages`, and `src/layouts`
- Modify: `src/styles/global.css` only where Chinese typography needs adjustment

- [ ] **Step 1: Set project and site identity**

Configure these exact values while preserving the template's object shape:

```ts
title: "逍遥哥的知识库"
description: "记录技术实践、项目复盘、GitHub 笔记与长期可复用的知识。"
lang: "zh-CN"
```

Set the date locale to `zh-CN`, use the temporary canonical URL `https://xiaoyao-knowledge.pages.dev`, and set `package.json` name to `xiaoyao-knowledge-blog`.

- [ ] **Step 2: Localize visible navigation and utility copy**

Use the approved labels: `首页`, `文章`, `笔记`, `标签`, `搜索`, `关于`. Translate empty states, pagination, reading-time labels, 404 copy, and search prompts without renaming route paths required by Cactus.

- [ ] **Step 3: Tune Chinese typography**

Use the existing neutral palette and theme behavior. Ensure body text uses a readable system sans fallback for Chinese, preserve monospaced code blocks, set letter spacing to `0`, and keep content width and spacing consistent with Cactus.

- [ ] **Step 4: Run static checks**

Run: `pnpm check`

Expected: Astro and Biome checks exit with code 0.

- [ ] **Step 5: Commit localization**

```powershell
git add package.json src
git commit -m "feat: localize and brand knowledge blog"
```

### Task 5: Replace template demo content with real starter content

**Files:**
- Remove: Cactus demo posts, notes, and tags under `content`
- Create: `content/post/hello-knowledge-base.md`
- Create: `content/note/github-notes-workflow.md`
- Create: Chinese tag descriptions matching the actual frontmatter tags
- Modify: About-page content at the template's existing route

- [ ] **Step 1: Add the introductory article**

Use title `欢迎来到逍遥哥的知识库`, a 50–160 character Chinese description, current publication date, tags `建站` and `知识管理`, and explain the article/note distinction plus safe publishing boundary.

- [ ] **Step 2: Add the GitHub note workflow**

Use title `GitHub 笔记发布流程`, describe the white-list-only publishing rule, and include no synthetic credentials, private URLs, or fake statistics.

- [ ] **Step 3: Add About and tag descriptions**

The About page states that the site records technical practice and reusable knowledge. Tag pages describe only content that exists in the initial article and note.

- [ ] **Step 4: Verify content schema and safety**

Run:

```powershell
pnpm check:content
pnpm check
pnpm build
```

Expected: content safety, schemas, static build, RSS, sitemap, OG generation, and Pagefind indexing all succeed.

- [ ] **Step 5: Commit starter content**

```powershell
git add content src
git commit -m "content: add Chinese knowledge blog starter"
```

### Task 6: Configure Cloudflare deployment

**Files:**
- Create: `wrangler.jsonc`
- Modify: `README.md`

- [ ] **Step 1: Add static asset configuration**

Create:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "xiaoyao-knowledge",
  "compatibility_date": "2026-07-15",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

- [ ] **Step 2: Document the content and deployment workflow**

Replace template-oriented README copy with project commands, content directories, safety behavior, build output, and Cloudflare deployment command. Do not document secrets or account identifiers.

- [ ] **Step 3: Verify configuration and commit**

Run: `pnpm build`

Expected: `dist/index.html`, `dist/404.html`, Pagefind assets, RSS, and sitemap exist.

```powershell
git add wrangler.jsonc README.md
git commit -m "chore: configure Cloudflare deployment"
```

### Task 7: Browser and responsive QA

**Files:**
- Create: `outputs/qa/desktop-home.png`
- Create: `outputs/qa/mobile-home.png`
- Modify: only files required to fix observed issues

- [ ] **Step 1: Start the local production preview**

Run: `pnpm preview --host 127.0.0.1`

Expected: preview server starts and exposes a local URL.

- [ ] **Step 2: Verify desktop behavior**

At 1440×1000, inspect the first viewport, article list, note list, tag navigation, search, theme switch, article table of contents, and 404 page. Capture `outputs/qa/desktop-home.png`.

- [ ] **Step 3: Verify mobile behavior**

At 390×844, inspect navigation, Chinese long-title wrapping, code-block overflow, search results, and theme switch. Capture `outputs/qa/mobile-home.png`.

- [ ] **Step 4: Verify search and generated endpoints**

Search for `GitHub` and `知识`; confirm both return the expected starter content. Request `/rss.xml`, `/sitemap-index.xml` or the generated sitemap path, and a missing URL.

- [ ] **Step 5: Fix and repeat until clean**

No clipped text, overlap, horizontal page scroll, placeholder copy, inert controls, missing images, or browser console errors may remain.

- [ ] **Step 6: Commit QA fixes**

```powershell
git add src content public outputs/qa
git commit -m "fix: polish responsive blog experience"
```

### Task 8: Authenticate and deploy to Cloudflare

**Files:**
- No secret files may be created or committed

- [ ] **Step 1: Verify Cloudflare authentication**

Run: `npx wrangler whoami`

Expected: authenticated account information. If unauthenticated, run the official `npx wrangler login` OAuth flow, then repeat `whoami`.

- [ ] **Step 2: Run the final local verification**

Run:

```powershell
pnpm test
pnpm check
pnpm build
git diff --check
git status --short
```

Expected: tests/check/build pass, no whitespace errors, and only intentional QA artifacts are tracked.

- [ ] **Step 3: Deploy static assets**

Run: `npx wrangler deploy`

Expected: Cloudflare returns a production `*.workers.dev` or configured static deployment URL. If Pages CLI is required by the authenticated account/project flow, use `npx wrangler pages deploy dist --project-name xiaoyao-knowledge` and record the returned `*.pages.dev` URL.

- [ ] **Step 4: Verify production**

Open the returned production URL and repeat homepage, article, note, search, RSS, sitemap, HTTPS, desktop, and mobile smoke checks.

- [ ] **Step 5: Record deployment metadata**

Add the public production URL and exact redeploy command to `README.md`; do not record account IDs, tokens, or local OAuth data.

- [ ] **Step 6: Commit deployment documentation**

```powershell
git add README.md
git commit -m "docs: record Cloudflare deployment"
```

### Task 9: Optional GitHub remote setup when authenticated

**Files:**
- No additional product files required

- [ ] **Step 1: Check GitHub authentication without changing external state**

Run: `gh auth status`

Expected: authenticated GitHub account, or a clear unauthenticated result.

- [ ] **Step 2: Create the dedicated public repository only when authenticated**

Run: `gh repo create xiaoyao-knowledge-blog --public --source . --remote origin --push`

Expected: a new public repository containing only the reviewed blog project. If the repository name already exists or auth is absent, leave the local repository intact and report the remaining manual connection step instead of overwriting anything.

- [ ] **Step 3: Connect Cloudflare Git integration when dashboard authorization is available**

Set production branch to the repository default branch, build command to `pnpm build`, and output directory to `dist`. Verify that a subsequent documentation-only commit produces a preview or production deployment without exposing secrets.

## Final Verification Checklist

- [ ] `pnpm test`, `pnpm check`, and `pnpm build` pass from a clean checkout.
- [ ] Public-content scanner reports no findings and never prints secret values.
- [ ] Desktop and mobile screenshots show the accepted Cactus layout with Chinese copy.
- [ ] Search finds Chinese and GitHub content.
- [ ] Article, note, tags, RSS, sitemap, 404, theme switch, and navigation work.
- [ ] Production HTTPS URL is reachable and documented.
- [ ] No existing external GitHub notes were imported without an explicit whitelist.
