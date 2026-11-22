# Deployment

MoonFOD is a static app. Its runtime files are in `dist/`; no database, backend service, or daily scheduled job is required. These instructions use Cloudflare Workers Static Assets.

## Prerequisites

- Node.js 22 or newer and npm.
- A Cloudflare account with permission to deploy Workers.
- An active domain zone in that account for custom-domain hosting.

Install the pinned development tools from the repository root:

```sh
npm ci
```

## Configure a fork

The checked-in configuration targets the public MoonFOD project. For your own deployment, update `site.config.json`:

- `name`: the site name used in metadata.
- `slug`: a unique Cloudflare Worker name.
- `url`: your public HTTPS origin, used for canonical and social URLs.
- `repositoryUrl`: your public source repository URL.

Set the matching domain in `wrangler.jsonc`, keeping the existing static-assets settings:

```json
"routes": [
  {"pattern": "example.com", "custom_domain": true}
]
```

The domain must be active in the Cloudflare account you deploy to. Wrangler connects the custom domain, and Cloudflare manages its DNS records and HTTPS certificate. See [Cloudflare's custom-domain guide](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

The default configuration disables alternate `workers.dev` and version-preview addresses. Domain registration and renewal are separate from application deployment.

## Authenticate

```sh
npx wrangler login --use-keyring --scopes account:read user:read workers:write workers_scripts:write workers_routes:write zone:read
npx wrangler whoami
```

Complete authorization in your browser. `--use-keyring` protects stored credentials with the operating system's credential store. If a localhost callback is unavailable, add `--device` to the login command.

Credentials stay outside the repository. `.gitignore` excludes environment files and local Wrangler state. The GitHub validation workflow needs no deployment credentials.

## Publish an update

```sh
npm test && npm run check:deploy && npm run deploy
```

`check:deploy` uploads nothing. `deploy` generates metadata and uploads the app to the configured Cloudflare account and domain. New domains may need a short interval for HTTPS activation.

Open the reported URL and check the Moon, date navigation, feature outlines, and lessons. Verify `/robots.txt`, `/sitemap.xml`, and `/assets/social-preview.jpg` after changes to site metadata.

Commit and push your source changes separately. GitHub Actions validates commits but does not deploy them; a Git push alone does not update the live website.

Application files revalidate through Cloudflare's cache. Image assets have a one-day browser cache, so use a new filename when replacing an image that must update immediately.
