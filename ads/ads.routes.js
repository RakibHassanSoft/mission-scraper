const express = require("express");
const router = express.Router();
const controller = require("./ads.controller");

router.post("/start", controller.start);
router.post("/stop", controller.stop);
router.get("/status", controller.status); 
router.delete("/delete-all", controller.deleteAll);
router.get("/get-all", controller.getAds);

module.exports = router;