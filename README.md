# MoonFOD

A single-page lunar field guide: a date-accurate Moon, quiet day navigation, and one discovery each day from 24 major landmarks.

## Run locally

```sh
cd moonfod
npm run dev
```

Open `http://127.0.0.1:4173`. This is a buildless static app; there are no runtime package installs or third-party network requests. All runtime assets are in `dist/`.

```sh
npm test
```

## Experience

The Moon fills the view against a subtle star field. Side arrows move one day at a time. Today follows the clock; past and future dates use 21:00 in the browser's local timezone. A small caption identifies today's or a past day's discovery. Tap its name or geographic outline for the lesson and observing tip. Outlines are faint grey by default and brighten to gold when the boundary or feature name is hovered or focused. The terrain remains unfilled and unobscured. Future dates show the Moon without revealing a discovery.

Brightness uses the preferred 40% viewing level with automatic phase compensation and no on-screen control. Exposure decreases toward full Moon, while shadow detail receives a stronger lift during dark phases. Smooth compensation curves are anchored to the preferred gibbous view. Phase and sunlight geometry stay unchanged.

Left/right arrow keys navigate dates; Home returns to today. The interface supports keyboard focus, reduced motion, and small screens. The previous atlas, collection, timeline, and advanced rendering controls are no longer displayed.

## Rendering and astronomy

- WebGL renders an orthographic lunar disk using LROC color and LOLA elevation maps from NASA's [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/).
- The view uses 4096 × 2048 color and 2048 × 1024 elevation textures. Larger source assets remain available in the repository but are not requested by the current interface.
- Raster work is limited to 1.2 million pixels. There is no continuous render loop. Draw requests are coalesced, replaced WebGL resources are freed, and hidden tabs pause drawing. No CPU-side thumbnail map is retained.
- Filmic tone mapping retains highlight detail. Phase-aware exposure reduces full-Moon glare, while adaptive fill keeps dark phases readable for study. These are display enhancements, not a model of physical lunar brightness. This is an SDR canvas, not true HDR output.
- Astronomy Engine supplies geocentric Sun/Moon vectors, the phase fraction, and the IAU 2015 lunar rotation axis/prime meridian. The rotation epoch accounts for Moon–Earth light travel time. The same basis projects feature coordinates onto the surface.
- Normal perturbation and a short surface-shadow march add local terrain relief. This is an educational visualization, not a photometric or navigation instrument. The disk is held at a convenient display size rather than varying its apparent diameter with distance. Earthshine is approximate, stars are decorative, and lunar eclipses are not modeled.
- All 24 features use the default LOLA 2011 geometries from the USGS Gazetteer: polygons for named areas and craters, and open traces for Rupes Recta and Vallis Alpes. These are approximate named-feature extents, not precise geological contacts. `scripts/import-outlines.py` reproduces the bundled data; original WKT and provenance are retained in `data/usgs-feature-outlines.json`. Outlines use the same body/view basis as the Moon and are clipped at the visible limb.
- Celestial north is up. This is not the orientation relative to a particular observer's horizon. Dates from 1900 through 2100 are supported.
- Lessons remain stable within the local calendar day and prioritize major features and variety. Candidates must be Earth-facing and clear of the limb at the beginning, middle, and end of the day, plus the 21:00 viewing time. A final check uses the actual displayed instant. Both sunlit and night-side terrain is eligible, including near new Moon. A night-side lesson explains that enhanced display brightness reveals its terrain for study. The 24-feature curriculum eventually repeats.

## Sources and validation

Feature positions and rounded dimensions use the [IAU/USGS Gazetteer](https://planetarynames.wr.usgs.gov/). Lessons explain common lunar geology and link to NASA, LROC, or Gazetteer sources. Color: NASA/GSFC/Arizona State University/LROC; elevation: NASA/GSFC/LOLA. Astronomy Engine: Don Cross, MIT license, included under `dist/vendor/`.

Independent comparison data in `tests/nasa-reference.json` is sampled from NASA's [2026 Moon phase and libration](https://svs.gsfc.nasa.gov/5587/) hourly table. Tests check illumination, sub-Earth latitude/longitude, subsolar longitude, axial position angle, distance, lunar-age rollover, projection, and daily-feature selection. Additional tests check future-discovery gating, date rollover, outline projection and limb clipping, brightness values, and inclusion of visible night-side landmarks and exclusion of hidden terrain. Day-stable visibility is checked hourly across 90 days. Browser checks cover desktop/mobile layouts, date navigation, feature details, hidden future discoveries, automatic phase brightness, outline emphasis, and new-Moon lessons.

## Publishing

Prepared locally for **moonfod.com**; the domain has not been registered and the app has not been published. The repository name and Cloudflare Worker name are **moonfod**.

Cloudflare Workers Static Assets serves the app with its global CDN and HTTPS. No separate CDN, server, database, or daily scheduled job is needed. No analytics is used. See [the publishing guide](docs/publishing.md) for the exact CLI steps.

`site.config.json` owns the name, slug, and canonical URL. `npm run build` updates search/social metadata, structured data, the sitemap, robots.txt, and the Worker name. The app is still plain static HTML/JS; this step only prepares metadata.

`npm run check:deploy` runs a local Wrangler dry run; it uploads nothing. `npm run deploy` performs a real public deployment and should only be run when publication is intended. GitHub Actions runs checks only and does not deploy.

## License

Original code and lesson text: [MIT](LICENSE). NASA imagery, USGS data, and Astronomy Engine retain their own notices; see [third-party credits](THIRD_PARTY_NOTICES.md).
