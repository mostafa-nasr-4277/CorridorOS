# Deployment Guide (Calm, Opt‑In)

This repository separates validation (build + checks) from publication (GitHub Pages deploy) to keep CI calm, predictable, and fast for everyday work.

## Workflows

- Site CI (build + validate + artifact)
  - File: `.github/workflows/site-ci.yml`
  - Runs on pushes/PRs touching site assets (apps/**, brand/**, index.html, corridor-os.html, etc.).
  - Produces an artifact named `site-dist` you can preview or download.
  - Does NOT publish to GitHub Pages.

- Pages Deploy (publish)
  - File: `.github/workflows/static-deploy.yml`
  - Opt‑in only: triggers on tag pushes or manual dispatch.
  - Rebuilds `dist/` in CI, validates core files, and then publishes to GitHub Pages.

## Publish (opt‑in)

Choose one of the following:

1) Manual dispatch
- GitHub → Actions → “CorridorOS Pages Deploy” → Run workflow.

2) Tag push (recommended)
```bash
# Versioned release
git tag v1.2.3
git push origin v1.2.3

# Or a dated deploy tag
git tag deploy-$(date +%Y-%m-%d)
git push origin deploy-$(date +%Y-%m-%d)
```

Once the deploy job finishes, Pages will update at your configured URL.

## Preview before publish

Every push/PR runs Site CI which:
- Runs `scripts/prepare_dist.sh` to build `dist/` (portable BSD/GNU)
- Validates:
  - `dist/index.html`, `dist/404.html`
  - Vytall SPA: `dist/apps/vytall/spa/index.html`
  - Atlas manifest: `dist/apps/atlas/assets/atlas_manifest.json` (JSON-checked)
- Uploads `site-dist` artifact for inspection.

Use this artifact to verify changes before creating a deploy tag.

## Notes & Tips

- Portable build: `scripts/prepare_dist.sh` detects GNU/BSD `sed` and `shasum/sha256sum` and has fallbacks when `rsync` is unavailable.
- Concurrency: Site CI uses a branch‑scoped concurrency group so the newest run cancels older ones for the same branch.
- Git hygiene: `.gitattributes` normalizes line endings (LF) and marks assets appropriately; `.gitignore` excludes `dist/` and local clutter.

## Troubleshooting

- Deploy workflow didn’t start:
  - Ensure you pushed a tag matching `v*` or `deploy-*`, or ran the workflow manually.
- Pages still serves old content:
  - Hard refresh, or add a cache‑buster query to URLs (e.g., `?v=<commit>`).
- Build fails in CI:
  - Check the Site CI logs and `site-dist` artifact for missing files.
  - Verify `apps/` and `brand/` assets are present and referenced correctly.

## Rollback

Publish a previous known‑good tag, or re‑run Pages Deploy on a selected commit via manual dispatch (Actions → Run workflow → select ref).

---
Maintainers can adjust the opt‑in rule (tags only vs. manual) in `.github/workflows/static-deploy.yml`.
