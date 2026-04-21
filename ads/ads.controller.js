const adsScraper = require("../adsScraper/ads.scraper");
const adsService = require("./ads.service");

// =========================
// START
// =========================
exports.start = async (req, res) => {
  const {
    url,
    keyword = "pant",
    country = "ALL",
    status = "active",
    adType = "all",
    mediaType = "all",
    searchType = "keyword_exact_phrase",
    sortMode = "total_impressions",
    direction = "desc",
  } = req.body;

  let finalUrl;

  // =========================
  // USE URL OR BUILD DEFAULT
  // =========================
  if (url) {
    finalUrl = url;
  } else {
    const q = encodeURIComponent(keyword);

    finalUrl = `https://www.facebook.com/ads/library/?active_status=${status}&ad_type=${adType}&country=${country}&is_targeted_country=false&media_type=${mediaType}&q=${q}&search_type=${searchType}&sort_data[direction]=${direction}&sort_data[mode]=${sortMode}`;
  }

  adsScraper.startScraping(finalUrl);

  res.json({
    message: "Scraping started",
    url: finalUrl,
  });
};

// =========================
// STOP
// =========================
exports.stop = async (req, res) => {
  await adsScraper.stopScraping();

  res.json({
    message: "Scraping stopped",
  });
};

// =========================
// STATUS
// =========================
exports.status = (req, res) => {
  res.json(adsScraper.getStatus());
};

// =========================
// PAGINATION
// =========================
exports.getAds = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  const result = await adsService.getAds(page, limit);

  res.json(result);
};


exports.deleteAll = async (req, res) => {
  try {
    const result = await adsService.deleteAllAds();

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete ads",
      error: err.message,
    });
  }
};