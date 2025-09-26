// seo-check.js
// Run with: node seo-check.js http://localhost:3000/videos/<id>

import { chromium } from "playwright";

async function checkSEO(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  const results = {};

  // Grab title + meta
  results.title = (await page.title()) || "❌ Missing";

  const getMeta = async (selector) =>
    (await page.$eval(selector, (el) => el.content).catch(() => null)) ||
    "❌ Missing";

  results.description = await getMeta('meta[name="description"]');
  results.ogTitle = await getMeta('meta[property="og:title"]');
  results.ogDescription = await getMeta('meta[property="og:description"]');
  results.ogType = await getMeta('meta[property="og:type"]');
  results.ogImage = await getMeta('meta[property="og:image"]');
  results.twitterCard = await getMeta('meta[name="twitter:card"]');
  results.twitterTitle = await getMeta('meta[name="twitter:title"]');
  results.twitterDescription = await getMeta('meta[name="twitter:description"]');
  results.twitterImage = await getMeta('meta[name="twitter:image"]');

  const canonical =
    (await page.$eval('link[rel="canonical"]', (el) => el.href).catch(() => null)) ||
    "❌ Missing";
  results.canonical = canonical;

  // ✅ JSON-LD VideoObject detection
  const jsonLdScripts = await page.$$eval(
    'script[type="application/ld+json"]',
    (els) => els.map((el) => el.innerText)
  );

  let hasVideoObject = false;
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script);
      if (
        (Array.isArray(data) && data.some((d) => d["@type"] === "VideoObject")) ||
        data["@type"] === "VideoObject"
      ) {
        hasVideoObject = true;
        break;
      }
    } catch {
      continue;
    }
  }

  results.jsonLdVideoObject = hasVideoObject ? "✅ Present" : "❌ Missing";

  console.log(`\n🔍 SEO Report for ${url}`);
  console.table(results);

  await browser.close();
}

// Run with CLI arg
const url = process.argv[2];
if (!url) {
  console.error("Usage: node seo-check.js <url>");
  process.exit(1);
}
checkSEO(url);

