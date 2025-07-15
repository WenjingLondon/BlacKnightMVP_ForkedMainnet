// api/aave.js
const express = require("express");
const router = express.Router();
const { getAaveMarketData } = require("../scripts/aaveDataService");

router.get("/aave", async (req, res) => {
  try {
    const data = await getAaveMarketData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Aave data" });
  }
});

module.exports = router;
