# Third-party materials

The root MIT license covers this project's original application code and lesson text. Third-party software, imagery, and scientific data retain their own terms. No affiliation with or endorsement by NASA, USGS, IAU, or Arizona State University is implied.

## Astronomy Engine

`dist/vendor/astronomy.js` is by Don Cross and contributors, distributed under the MIT license. Its complete copyright and license notice is preserved in [`dist/vendor/ASTRONOMY-LICENSE.txt`](dist/vendor/ASTRONOMY-LICENSE.txt).

Source: https://github.com/cosinekitty/astronomy

## Lunar surface imagery and elevation

The Moon color maps and elevation maps in `dist/assets/` come from NASA's [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/). Smaller versions are derived from those source maps. The social preview, when present, is a screenshot of the app rendering these maps.

- Color imagery: NASA / GSFC / Arizona State University / LROC.
- Elevation: NASA / GSFC / LOLA.

NASA permits educational and informational use of its media subject to its [Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). These materials are credited to their sources and are not relicensed under this project's MIT license. NASA identifiers and third-party rights are not granted by this repository.

## Lunar nomenclature and feature outlines

Feature positions, dimensions, and approximate outlines come from the [IAU/USGS Gazetteer of Planetary Nomenclature](https://planetarynames.wr.usgs.gov/). The default LOLA 2011 outlines are bundled in `dist/outlines.js`; the original WKT geometries, feature URLs, and retrieval provenance are retained in `data/usgs-feature-outlines.json`. `scripts/import-outlines.py` reproduces the import.

These outlines identify approximate named-feature extents, not precise geological contacts. Original educational explanations are authored for this app; agency source links do not imply agency review of that text.

## Validation data

`tests/nasa-reference.json` contains samples of the [NASA 2026 Moon phase and libration table](https://svs.gsfc.nasa.gov/5587/), used to independently check the astronomical calculations.

## Development tools

Wrangler and its dependencies are development-only packages installed through npm. They retain the licenses shipped with their packages and are not delivered to visitors.
