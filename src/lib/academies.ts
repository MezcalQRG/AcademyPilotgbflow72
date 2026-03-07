
'use server';

export interface Academy {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone?: string;
  email?: string;
  distance?: number;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: any[];
}

/**
 * Calculates distance between two points in meters using Haversine formula
 */
function calculateDistance(p1: {lat: number, lng: number}, p2: {lat: number, lng: number}): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Geocodes an address string using the REST Geocoding API.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
  }
  return null;
}

/**
 * Searches for academies using the Places API (New) REST interface.
 */
export async function findFranchise(location: { lat: number, lng: number }, radiusInMeters: number): Promise<Academy[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.internationalPhoneNumber,places.photos'
      },
      body: JSON.stringify({
        textQuery: "Gracie Barra",
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: Math.min(radiusInMeters, 50000)
          }
        }
      })
    });

    const data = await response.json();

    if (data.places && data.places.length) {
      const results = data.places.map((place: any) => {
        const placeLat = place.location.latitude;
        const placeLng = place.location.longitude;
        const distance = calculateDistance(location, { lat: placeLat, lng: placeLng });
        
        return {
          id: place.id,
          name: place.displayName.text || "Gracie Barra Academy",
          address: place.formattedAddress || "",
          city: "",
          state: "",
          zip: "",
          lat: placeLat,
          lng: placeLng,
          rating: place.rating,
          distance: distance,
          phone: place.internationalPhoneNumber || "",
          photos: place.photos || []
        };
      });

      return results
        .filter((academy: any) => academy.distance <= radiusInMeters)
        .sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
    }
  } catch (error) {
    console.error("Error searching for places:", error);
  }

  return [];
}

/**
 * Fetches detailed information using the Places API (New) REST interface.
 */
export async function getPlaceDetails(placeId: string): Promise<Academy | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,websiteUri,rating,userRatingCount,photos,internationalPhoneNumber`;
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey
      }
    });

    const place = await response.json();

    return {
      id: place.id,
      name: place.displayName.text || "Gracie Barra Academy",
      address: place.formattedAddress || "",
      city: "",
      state: "",
      zip: "",
      lat: place.location.latitude,
      lng: place.location.longitude,
      phone: place.internationalPhoneNumber || "",
      websiteUri: place.websiteUri || "",
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      photos: place.photos || [],
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}
