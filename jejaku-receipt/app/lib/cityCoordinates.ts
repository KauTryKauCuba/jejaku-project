// Offline city-name -> approximate coordinates lookup, used to place a pin
// for a receipt's city/state/country without calling any geocoding API —
// keeps this self-hosted and free, at the cost of precision: these are
// city-centroid approximations (good enough to show "which city", not
// "which street"), and only cover a curated set of major cities. A city not
// in the list falls back to its country's centroid; a country not in the
// list resolves to no pin at all.

type CityEntry = { city: string; state?: string; country: string; lat: number; lng: number };

const CITIES: CityEntry[] = [
  // Southeast Asia
  { city: "Kuala Lumpur", country: "Malaysia", lat: 3.139, lng: 101.6869 },
  { city: "Petaling Jaya", state: "Selangor", country: "Malaysia", lat: 3.1073, lng: 101.6067 },
  { city: "Subang Jaya", state: "Selangor", country: "Malaysia", lat: 3.0567, lng: 101.5851 },
  { city: "Shah Alam", state: "Selangor", country: "Malaysia", lat: 3.0733, lng: 101.5185 },
  { city: "Johor Bahru", country: "Malaysia", lat: 1.4927, lng: 103.7414 },
  { city: "Penang", country: "Malaysia", lat: 5.4141, lng: 100.3288 },
  { city: "George Town", country: "Malaysia", lat: 5.4141, lng: 100.3288 },
  { city: "Malacca", country: "Malaysia", lat: 2.1896, lng: 102.2501 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { city: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { city: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { city: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
  { city: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lng: 106.6297 },
  { city: "Hanoi", country: "Vietnam", lat: 21.0278, lng: 105.8342 },

  // East Asia
  { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { city: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023 },
  { city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
  { city: "Hong Kong", country: "Hong Kong", lat: 22.3193, lng: 114.1694 },
  { city: "Taipei", country: "Taiwan", lat: 25.033, lng: 121.5654 },
  { city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
  { city: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { city: "Shenzhen", country: "China", lat: 22.5431, lng: 114.0579 },

  // South Asia
  { city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { city: "Delhi", country: "India", lat: 28.7041, lng: 77.1025 },
  { city: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },

  // Oceania
  { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { city: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { city: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },

  // Middle East
  { city: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708 },
  { city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lng: 54.3773 },
  { city: "Doha", country: "Qatar", lat: 25.2854, lng: 51.531 },
  { city: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },

  // Europe
  { city: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276 },
  { city: "Manchester", country: "United Kingdom", lat: 53.4808, lng: -2.2426 },
  { city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { city: "Munich", country: "Germany", lat: 48.1351, lng: 11.582 },
  { city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { city: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { city: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686 },
  { city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { city: "Milan", country: "Italy", lat: 45.4642, lng: 9.19 },
  { city: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417 },
  { city: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
  { city: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { city: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { city: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { city: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { city: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522 },
  { city: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122 },

  // North America
  { city: "New York", state: "NY", country: "United States", lat: 40.7128, lng: -74.006 },
  { city: "Los Angeles", state: "CA", country: "United States", lat: 34.0522, lng: -118.2437 },
  { city: "San Francisco", state: "CA", country: "United States", lat: 37.7749, lng: -122.4194 },
  { city: "Chicago", state: "IL", country: "United States", lat: 41.8781, lng: -87.6298 },
  { city: "Springfield", state: "IL", country: "United States", lat: 39.7817, lng: -89.6501 },
  { city: "Seattle", state: "WA", country: "United States", lat: 47.6062, lng: -122.3321 },
  { city: "Austin", state: "TX", country: "United States", lat: 30.2672, lng: -97.7431 },
  { city: "Boston", state: "MA", country: "United States", lat: 42.3601, lng: -71.0589 },
  { city: "Miami", state: "FL", country: "United States", lat: 25.7617, lng: -80.1918 },
  { city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { city: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { city: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },

  // South America
  { city: "Sao Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { city: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { city: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },

  // Africa
  { city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { city: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { city: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
];

// Country-centroid fallback for a city that isn't in the curated list above
// — coarser (country-level, not city-level) but still puts the pin in
// roughly the right place rather than dropping it entirely.
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  malaysia: [4.2105, 101.9758],
  singapore: [1.3521, 103.8198],
  thailand: [15.870, 100.9925],
  indonesia: [-0.7893, 113.9213],
  philippines: [12.8797, 121.774],
  vietnam: [14.0583, 108.2772],
  japan: [36.2048, 138.2529],
  "south korea": [35.9078, 127.7669],
  "hong kong": [22.3193, 114.1694],
  taiwan: [23.6978, 120.9605],
  china: [35.8617, 104.1954],
  india: [20.5937, 78.9629],
  australia: [-25.2744, 133.7751],
  "new zealand": [-40.9006, 174.886],
  "united arab emirates": [23.4241, 53.8478],
  qatar: [25.3548, 51.1839],
  turkey: [38.9637, 35.2433],
  "united kingdom": [55.3781, -3.436],
  france: [46.2276, 2.2137],
  germany: [51.1657, 10.4515],
  netherlands: [52.1326, 5.2913],
  spain: [40.4637, -3.7492],
  italy: [41.8719, 12.5674],
  switzerland: [46.8182, 8.2275],
  austria: [47.5162, 14.5501],
  ireland: [53.4129, -8.2439],
  portugal: [39.3999, -8.2245],
  sweden: [60.1282, 18.6435],
  denmark: [56.2639, 9.5018],
  norway: [60.472, 8.4689],
  poland: [51.9194, 19.1451],
  "united states": [39.8283, -98.5795],
  canada: [56.1304, -106.3468],
  mexico: [23.6345, -102.5528],
  brazil: [-14.235, -51.9253],
  argentina: [-38.4161, -63.6167],
  egypt: [26.8206, 30.8025],
  nigeria: [9.082, 8.6753],
  kenya: [-0.0236, 37.9062],
  "south africa": [-30.5595, 22.9375],
};

function norm(s: string | undefined | null) {
  return (s ?? "").trim().toLowerCase();
}

// city/state/country as free text (from AI extraction or manual entry) ->
// approximate {lat, lng}, or null if nothing in the offline dataset matches.
export function lookupCoordinates(
  city?: string | null,
  state?: string | null,
  country?: string | null
): { lat: number; lng: number } | null {
  const c = norm(city);
  const s = norm(state);
  const co = norm(country);

  if (c) {
    const match = CITIES.find(
      (e) => norm(e.city) === c && (!s || norm(e.state) === s) && (!co || norm(e.country) === co)
    );
    if (match) return { lat: match.lat, lng: match.lng };
  }

  if (co && COUNTRY_CENTROIDS[co]) {
    const [lat, lng] = COUNTRY_CENTROIDS[co];
    return { lat, lng };
  }

  return null;
}
