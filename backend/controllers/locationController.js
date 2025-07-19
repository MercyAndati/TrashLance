const axios = require("axios")

// Kenya bounding box: left, bottom, right, top
const KENYA_VIEWBOX = "33.909898,-4.678047,41.899578,5.019938"
const NAIROBI_DEFAULT = {
  name: "Nairobi, Kenya (default)",
  latitude: "-1.286389",
  longitude: "36.817223"
}

// GET /api/location/search?query=ruai
exports.searchLocation = async (req, res) => {
  const query = req.query.query
  if (!query) {
    return res.status(400).json({ success: false, message: "Query parameter is required" })
  }
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        addressdetails: 1,
        limit: 5,
        viewbox: KENYA_VIEWBOX,
        bounded: 1
      },
      headers: {
        "User-Agent": "TrashLance/1.0 (your@email.com)",
      },
    })
    let results = response.data.map((place) => ({
      name: place.display_name,
      latitude: place.lat,
      longitude: place.lon,
    }))
    if (results.length === 0) {
      results = [NAIROBI_DEFAULT]
    }
    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, message: "Location search failed" })
  }
} 