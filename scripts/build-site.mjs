import {readFile, writeFile} from 'node:fs/promises';

// Only writes local static files. It does not sign in, register a domain, or deploy.
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const write = (path, content) => writeFile(new URL(path, root), content);
const site = JSON.parse(await read('site.config.json'));
if (typeof site.name !== 'string' || !site.name.trim()) throw new Error('Set a nonempty site name.');
if (!/^[a-z][a-z0-9-]{0,62}$/.test(site.slug)) throw new Error('Use a lowercase repository/Worker slug.');
const url = new URL(site.url);
if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/') {
  throw new Error('site.url must be an HTTPS origin, such as https://moonfod.com.');
}
const origin = url.origin;
const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const title = `Moon Feature of the Day — ${site.name}`;
const description = 'Learn one Moon feature each day. Explore craters, lunar seas, and mountains on an interactive Moon with date-accurate phases, rotation, and feature outlines.';
const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: site.name,
  alternateName: 'Moon Feature of the Day',
  url: `${origin}/`,
  description,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  browserRequirements: 'JavaScript and WebGL',
  inLanguage: 'en',
  isAccessibleForFree: true,
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
  image: `${origin}/assets/social-preview.jpg`
};
const metadata = `<!-- site-metadata:start -->
 <title>${escape(title)}</title>
 <meta name="description" content="${escape(description)}">
 <meta name="application-name" content="${escape(site.name)}">
 <meta name="robots" content="index, follow, max-image-preview:large">
 <link rel="canonical" href="${origin}/">
 <meta property="og:type" content="website">
 <meta property="og:locale" content="en_US">
 <meta property="og:site_name" content="${escape(site.name)}">
 <meta property="og:title" content="${escape(title)}">
 <meta property="og:description" content="${escape(description)}">
 <meta property="og:url" content="${origin}/">
 <meta property="og:image" content="${origin}/assets/social-preview.jpg">
 <meta property="og:image:width" content="1200">
 <meta property="og:image:height" content="630">
 <meta property="og:image:alt" content="A detailed Moon against a star field, with a daily lunar feature to explore.">
 <meta name="twitter:card" content="summary_large_image">
 <meta name="twitter:title" content="${escape(title)}">
 <meta name="twitter:description" content="${escape(description)}">
 <meta name="twitter:image" content="${origin}/assets/social-preview.jpg">
 <meta name="twitter:image:alt" content="A detailed Moon against a star field, with a daily lunar feature to explore.">
 <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
 <!-- site-metadata:end -->`;
const html = await read('dist/index.html');
const block = /<!-- site-metadata:start -->[\s\S]*?<!-- site-metadata:end -->/;
if (!block.test(html)) throw new Error('Missing metadata markers in dist/index.html.');
await write('dist/index.html', html.replace(block, () => metadata));
await write('dist/site.js', `// Generated from site.config.json by npm run build.\nexport const site = ${JSON.stringify({...site, url: origin}, null, 2)};\n`);
await write('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await write('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc><changefreq>daily</changefreq></url>\n</urlset>\n`);
const config = JSON.parse(await read('wrangler.jsonc'));
config.name = site.slug;
await write('wrangler.jsonc', `${JSON.stringify(config, null, 2)}\n`);
console.log(`Prepared ${site.name} for ${origin}. No files were uploaded.`);
