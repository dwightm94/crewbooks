const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const https = require("https");

const ssm = new SSMClient({ region: process.env.REGION || "us-east-1" });
let cachedApiKey = null;

const getApiKey = async () => {
  if (cachedApiKey) return cachedApiKey;
  const res = await ssm.send(new GetParameterCommand({
    Name: "/crewbooks/dev/GOOGLE_MAPS_API_KEY",
    WithDecryption: true,
  }));
  cachedApiKey = res.Parameter.Value;
  return cachedApiKey;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Content-Type": "application/json",
};

const success = (data) => ({ statusCode: 200, headers: cors, body: JSON.stringify({ success: true, data }) });
const error = (msg, code = 400) => ({ statusCode: code, headers: cors, body: JSON.stringify({ success: false, error: msg }) });

// Google Routes API — compute route matrix then find optimal order
async function callGoogleRoutes(apiKey, addresses) {
  // Use Routes API computeRoutes with optimizeWaypointOrder
  const origin = addresses[0];
  const destination = addresses[addresses.length - 1];
  const intermediates = addresses.slice(1, -1);

  const body = JSON.stringify({
    origin: { address: origin },
    destination: { address: destination },
    intermediates: intermediates.map((addr) => ({ address: addr })),
    travelMode: "DRIVE",
    optimizeWaypointOrder: true,
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
    languageCode: "en-US",
    units: "IMPERIAL",
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "routes.googleapis.com",
      path: "/directions/v2:computeRoutes",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.optimizedIntermediateWaypointIndex",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            console.error("Google Routes error:", data);
            reject(new Error(parsed.error?.message || "Google Routes API error"));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Fallback: Distance Matrix API for simpler optimization
async function callDistanceMatrix(apiKey, addresses) {
  const origins = addresses.map(encodeURIComponent).join("|");
  const destinations = origins;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&key=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

// Nearest-neighbor TSP approximation using distance matrix
function nearestNeighborOrder(matrix, n) {
  const visited = new Set([0]);
  const order = [0];
  let current = 0;

  while (visited.size < n) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited.has(j)) continue;
      const el = matrix.rows[current]?.elements[j];
      const dist = el?.duration?.value || Infinity;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
      }
    }
    if (bestIdx === -1) break;
    visited.add(bestIdx);
    order.push(bestIdx);
    current = bestIdx;
  }
  return order;
}

// Format seconds to readable string
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
}

function formatDistance(meters) {
  const miles = (meters * 0.000621371).toFixed(1);
  return `${miles} mi`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { stops, date } = body;

    if (!stops || !Array.isArray(stops) || stops.length < 2) {
      return error("Need at least 2 stops with addresses");
    }

    const addresses = stops.map((s) => s.address).filter(Boolean);
    if (addresses.length < 2) {
      return error("Need at least 2 valid addresses");
    }

    const apiKey = await getApiKey();
    let optimizedOrder;
    let totalDuration = null;
    let totalDistance = null;
    let originalDuration = null;

    // Try Google Routes API first (supports optimizeWaypointOrder)
    if (addresses.length >= 3) {
      try {
        const routeResult = await callGoogleRoutes(apiKey, addresses);
        const route = routeResult.routes?.[0];

        if (route) {
          // Parse optimized waypoint order
          const waypointOrder = route.optimizedIntermediateWaypointIndex || [];
          // Build full optimized order: origin + reordered intermediates + destination
          const reordered = [0];
          waypointOrder.forEach((wpIdx) => reordered.push(wpIdx + 1));
          reordered.push(addresses.length - 1);

          optimizedOrder = reordered.map((idx) => stops[idx]?.id).filter(Boolean);

          // Parse duration & distance
          const durationStr = route.duration; // e.g. "3600s"
          const durationSec = parseInt(durationStr?.replace("s", "")) || 0;
          totalDuration = formatDuration(durationSec);
          totalDistance = formatDistance(route.distanceMeters || 0);
        }
      } catch (routesErr) {
        console.warn("Routes API failed, falling back to Distance Matrix:", routesErr.message);
      }
    }

    // Fallback: Distance Matrix + nearest neighbor
    if (!optimizedOrder) {
      try {
        const matrixResult = await callDistanceMatrix(apiKey, addresses);

        if (matrixResult.status === "OK") {
          // Calculate original order total duration
          let origSec = 0;
          for (let i = 0; i < addresses.length - 1; i++) {
            origSec += matrixResult.rows[i]?.elements[i + 1]?.duration?.value || 0;
          }
          originalDuration = origSec;

          // Find optimized order
          const order = nearestNeighborOrder(matrixResult, addresses.length);
          optimizedOrder = order.map((idx) => stops[idx]?.id).filter(Boolean);

          // Calculate optimized total duration
          let optSec = 0;
          let optMeters = 0;
          for (let i = 0; i < order.length - 1; i++) {
            const el = matrixResult.rows[order[i]]?.elements[order[i + 1]];
            optSec += el?.duration?.value || 0;
            optMeters += el?.distance?.value || 0;
          }
          totalDuration = formatDuration(optSec);
          totalDistance = formatDistance(optMeters);
        }
      } catch (matrixErr) {
        console.error("Distance Matrix failed:", matrixErr.message);
        return error("Could not calculate routes. Check addresses and try again.");
      }
    }

    if (!optimizedOrder) {
      // Last resort: return original order
      optimizedOrder = stops.map((s) => s.id);
    }

    // Calculate time saved
    let timeSaved = null;
    if (originalDuration && totalDuration) {
      const optSec = parseInt(totalDuration) || 0;
      const savedSec = originalDuration - optSec;
      if (savedSec > 60) {
        timeSaved = formatDuration(savedSec);
      }
    }

    return success({
      optimizedOrder,
      totalDuration,
      totalDistance,
      timeSaved,
      stopCount: stops.length,
      date,
    });
  } catch (err) {
    console.error("Route optimization error:", err);
    return error("Route optimization failed: " + err.message, 500);
  }
};
