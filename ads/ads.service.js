const Ads = require("./ads.model");

// =========================
// GET ADS (PAGINATION)
// =========================
const getAds = async (page = 1, limit = 50) => {
  page = Math.max(1, parseInt(page));
  limit = Math.min(100, parseInt(limit));

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Ads.find({}, { url: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Ads.estimatedDocumentCount(),
  ]);

  return {
    data,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

// =========================
// DELETE ALL ADS (NEW)
// =========================
const deleteAllAds = async () => {
  const result = await Ads.deleteMany({});

  return {
    deleted: result.deletedCount,
    message: "All ads deleted successfully",
  };
};

module.exports = {
  getAds,
  deleteAllAds,
};