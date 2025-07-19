const express = require("express")
const router = express.Router()
const { searchLocation } = require("../controllers/locationController")

// GET /api/location/search?query=ruai
router.get("/search", searchLocation)

module.exports = router 