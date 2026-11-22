# Publish MoonFOD

## Current status

The app was deployed to [moonfod.com](https://moonfod.com) on November 22, 2026. The public [mrsmith/moonfod repository](https://github.com/mrsmith/moonfod) contains the source, MIT license, and GitHub Actions checks. The domain is registered and active in Cloudflare, and the `moonfod` Worker serves it as a custom domain. Alternate `workers.dev` and version-preview URLs are disabled. The original domain research is recorded in [the shortlist](domain-shortlist.md).

The application is the `dist/` directory. Cloudflare Workers Static Assets includes global caching and HTTPS. [Static asset requests are free and unlimited](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/); a separate CDN is unnecessary. The domain registration is a separate annual cost. All lunar calculations and daily lesson selection run in the visitor's browser, so there is no database, backend function, or midnight job to operate.

## 1. Check the local app

Use Node 22 or newer. From the repository root:

```sh
npm ci
npm test
npm run check:deploy
npm run dev
```

Open `http://127.0.0.1:4173`. `check:deploy` uses `wrangler deploy --dry-run` and uploads nothing. The `build` script prepares metadata; it does not bundle the app or publish files.

## 2. Access the public GitHub repository

The GitHub CLI is installed locally. Sign in with your own GitHub account:

```sh
gh auth login --hostname github.com --git-protocol https --web
gh auth status
```

The repository already exists. On a new machine, clone it with:

```sh
gh repo clone mrsmith/moonfod
cd moonfod
npm ci
```

The MIT license is included. `.gitignore` excludes login files, local hosting metadata, dependencies, and Wrangler state. GitHub Actions runs tests and a deployment dry run; it does not publish. No deployment secret is required for that workflow.

## 3. Sign in to Cloudflare

Wrangler is pinned in `package-lock.json`, so `npm ci` installs the tested version.

```sh
npx wrangler login --use-keyring --scopes account:read user:read workers:write workers_scripts:write workers_routes:write zone:read
npx wrangler whoami
```

Approve the CLI access in your browser. The keyring option stores the login in the operating system's credential store. No API token belongs in source code or GitHub. If multiple Cloudflare accounts are available, select the account that should own the website and domain.

## 4. Domain configuration

`moonfod.com` is registered in the same Cloudflare account as the Worker. Domain renewal is managed separately in Cloudflare Registrar; deploying the app does not register or renew the domain.

The following custom-domain configuration in `wrangler.jsonc` connects it during deployment:

```json
"routes": [
  {"pattern": "moonfod.com", "custom_domain": true}
]
```

Keep the existing `assets` configuration. The CLI creates the Worker custom-domain route, with Cloudflare managing DNS and the HTTPS certificate. [Cloudflare's custom domain guide](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) explains the active-zone requirement.

`site.config.json` holds the canonical address, brand, and Worker slug. If a different domain is chosen, update that file before publishing. Also update the package/repository name and documentation if the brand changes.

## 5. Deploy updates

This is the step that makes the app public:

```sh
npm test
npm run deploy
```

Wrangler prints the live URL. Open it and check the Moon, date arrows, feature outline, and lesson. Also check `/robots.txt`, `/sitemap.xml`, and `/assets/social-preview.jpg`.

The production configuration uses `workers_dev: false` and `preview_urls: false` so that `moonfod.com` is the single public address.

## Updating the site

```sh
npm test
npm run check:deploy
git add .
git commit -m "Describe the update"
git push
npm run deploy
```

GitHub keeps the source history; Cloudflare serves the published files. A Git push alone does not deploy this project. Cloudflare's default ETags revalidate application files; larger image assets use a one-day browser cache.

The app includes search descriptions, canonical and social tags, structured data, `robots.txt`, and a sitemap. Search indexing is not immediate or guaranteed. After launch, the sitemap can be submitted through a verified Google Search Console property; ownership verification must use the actual registered domain.
