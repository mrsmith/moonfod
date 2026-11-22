# MoonFOD

[Moon Feature of the Day](https://moonfod.com) is an interactive lunar field guide: explore a date-accurate Moon and learn one landmark each day. Its 24 lessons prioritize major craters, seas, mountains, and valleys.

## Run locally

Requires Node.js 22 or newer and Python 3.

```sh
git clone https://github.com/mrsmith/moonfod.git
cd moonfod
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. The local server disables browser caching so reloads pick up edits.

The app is plain HTML, CSS, and JavaScript in `dist/`. All runtime data and libraries are bundled; it needs no backend, API keys, database, or external data requests. Source links open external reference pages when selected. There is no analytics, account requirement, or location tracking.

## Explore the Moon

- Use the side arrows or swipe horizontally to change dates. Future dates show the Moon without revealing future lessons.
- On touchscreens, tap the Moon or feature name to highlight the feature outline, then tap the highlighted feature or its name to read the lesson.
- With a mouse, hover to highlight a feature and click to open it.
- Use Tab and Enter for controls, Left and Right to change dates, Home to return to today, and Escape to close a dialog or tooltip.

Today follows the clock; other dates use 21:00 in the browser's local timezone. Lessons remain stable within each local calendar day. Both sunlit and night-side features can be selected, and the 24-feature curriculum eventually repeats.

## Rendering and data

- WebGL renders NASA LRO color and elevation maps at 4K and 2K resolution. Drawing is limited to 1.2 million pixels and pauses in hidden tabs.
- Astronomy Engine supplies Sun/Moon geometry. The lunar rotation uses the IAU 2015 model and accounts for Moon–Earth light travel time. Dates from 1900 through 2100 are supported.
- Feature outlines use USGS Gazetteer LOLA 2011 geometries, projected onto the lunar surface and clipped at the visible limb. They represent approximate named-feature extents, not precise geological boundaries.
- `data/usgs-feature-outlines.json` preserves source geometries and provenance. `scripts/import-outlines.py` reproduces the import.

This is an educational visualization. Celestial north is up, rather than the orientation relative to a particular observer's horizon. Display brightness is enhanced to make night-side terrain readable. Earthshine is approximate, stars are decorative, and lunar eclipses are not simulated.

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Serve the app locally. |
| `npm test` | Check astronomy, feature selection, brightness, outlines, and gestures. |
| `npm run build` | Generate metadata, sitemap, robots.txt, and site configuration. |
| `npm run check:deploy` | Build and run a Cloudflare deployment dry run without uploading. |
| `npm run deploy` | Build and publish to the configured Cloudflare account and domain. |

The build does not bundle the application. Independent astronomy tests compare the calculations with samples from NASA's [2026 Moon phase and libration table](https://svs.gsfc.nasa.gov/5587/).

## Hosting

The live app uses Cloudflare Workers Static Assets, including its CDN and HTTPS. Other static hosts can serve `dist/` as well. See the [deployment guide](docs/publishing.md) for configuration and update instructions, including how to use your own domain for a fork.

GitHub Actions runs validation only. Pushing a commit does not deploy the website.

## License and sources

Original code and lesson text are [MIT licensed](LICENSE). NASA imagery, USGS data, and Astronomy Engine retain their own terms and credits; see [third-party notices](THIRD_PARTY_NOTICES.md).
