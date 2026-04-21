const puppeteer = require("puppeteer");
const Ads = require("../ads/ads.model");

let isRunning = false;
let browserInstance = null;
let totalCount = 0;

// =========================
// UNIQUE STORE (LIKE FILE VERSION)
// =========================
const urls = new Set();

// =========================
// UTIL
// =========================
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractEdges(json) {
  return (
    json?.data?.ad_library_main?.search_results_connection?.edges ||
    json?.data?.ad_archive_main?.search_results_connection?.edges ||
    json?.data?.search_results?.edges ||
    []
  );
}

// =========================
// MAIN SCRAPER (FILE STYLE LOGIC)
// =========================
const startScraping = async (targetUrl) => {
  try {
    if (isRunning) return;

    isRunning = true;
    totalCount = 0;
    urls.clear();

    browserInstance = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
      ],
    });

    const page = await browserInstance.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    );

    console.log("🚀 Scraper started:", targetUrl);

    // =========================
    // GRAPHQL LISTENER (FILE STYLE)
    // =========================
    page.on("response", async (res) => {
      if (!isRunning) return;

      try {
        const req = res.request();

        if (!req.url().includes("/api/graphql")) return;
        if (req.method() !== "POST") return;

        const text = await res.text();
        if (!text) return;

        let json;
        try {
          json = JSON.parse(text);
        } catch {
          return;
        }

        const edges = extractEdges(json);
        if (!Array.isArray(edges)) return;

        let newCount = 0;

        for (const edge of edges) {
          const url =
            edge?.node?.collated_results?.[0]?.snapshot?.page_profile_uri;

          if (url && !urls.has(url)) {
            urls.add(url);
            newCount++;
          }
        }

        // =========================
        // SAVE LIKE FILE VERSION
        // =========================
        if (newCount > 0) {
          const arr = [...urls].map((u) => ({ url: u }));

          await Ads.insertMany(arr, { ordered: false }).catch(() => {});

          totalCount = urls.size;

          console.log("🔥 Total:", totalCount);
        }
      } catch {}
    });

    // =========================
    // OPEN PAGE
    // =========================
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    console.log("✅ Page loaded");

    await sleep(5000);

    let steps = 0;
    let lastSize = 0;
    let stuck = 0;

    // =========================
    // FILE STYLE SCROLL LOOP
    // =========================
    while (isRunning && steps < 1000) {
      if (!isRunning) break;

      // 🔥 STRONG SCROLL (IMPORTANT FIX)
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * (2 + Math.random() * 3));
      });

      await sleep(1500 + Math.random() * 2500);

      // occasional backward scroll (like your file)
      if (Math.random() < 0.25) {
        await page.evaluate(() => {
          window.scrollBy(0, -window.innerHeight * 0.5);
        });
      }

      // human movement
      if (Math.random() < 0.3) {
        await page.mouse.move(Math.random() * 1000, Math.random() * 600);
      }

      // =========================
      // STUCK DETECTION (FILE STYLE)
      // =========================
      if (urls.size === lastSize) {
        stuck++;
      } else {
        stuck = 0;
        lastSize = urls.size;
      }

      if (stuck > 10) {
        console.log("⚠️ stuck reset");
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(2000);
        stuck = 0;
      }

      if (steps % 20 === 0) {
        console.log("📊 Progress:", urls.size);
      }

      steps++;
    }

    await browserInstance.close();
    isRunning = false;

    console.log("🛑 DONE:", urls.size);
  } catch (err) {
    console.error("❌ Error:", err.message);

    isRunning = false;

    if (browserInstance) {
      await browserInstance.close();
    }
  }
};

// =========================
// STOP
// =========================
const stopScraping = async () => {
  isRunning = false;

  if (browserInstance) {
    await browserInstance.close().catch(() => {});
  }
};

// =========================
// STATUS
// =========================
const getStatus = () => ({
  running: isRunning,
  count: totalCount,
});

module.exports = {
  startScraping,
  stopScraping,
  getStatus,
};
