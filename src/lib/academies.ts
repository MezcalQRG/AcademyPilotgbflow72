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
 * Geocodes an address string to lat/lng coordinates.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  if (typeof google === 'undefined' || !google.maps) return null;

  try {
    const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
    const geocoder = new Geocoder();
    const response = await geocoder.geocode({ address });
    
    if (response.results && response.results.length > 0) {
      const location = response.results[0].geometry.location;
      return { lat: location.lat(), lng: location.lng() };
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
  }
  return null;
}

/**
 * Searches for a franchise using the Places API's Text Search.
 */
export async function findFranchise(location: { lat: number, lng: number }, radiusInMeters: number): Promise<Academy[]> {
  if (typeof google === 'undefined' || !google.maps) {
    console.error("Google Maps API not loaded");
    return [];
  }

  try {
    const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

    const searchRadius = Math.min(Math.floor(radiusInMeters), 50000);

    const request: any = {
      textQuery: "Gracie Barra",
      fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'internationalPhoneNumber', 'photos'],
      locationBias: {
        center: { lat: Number(location.lat), lng: Number(location.lng) },
        radius: searchRadius
      }
    };

    const { places } = await Place.searchByText(request);

    if (places && places.length) {
      const results = places.map(place => {
        const placeLat = place.location?.lat() || 0;
        const placeLng = place.location?.lng() || 0;
        const distance = calculateDistance(location, { lat: placeLat, lng: placeLng });
        
        return {
          id: place.id,
          name: place.displayName || "Gracie Barra Academy",
          address: place.formattedAddress || "",
          city: "",
          state: "",
          zip: "",
          lat: placeLat,
          lng: placeLng,
          rating: place.rating,
          distance: distance,
          phone: place.internationalPhoneNumber || "",
          photos: place.photos as any[] || []
        };
      });

      return results
        .filter(academy => academy.distance <= radiusInMeters)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
  } catch (error) {
    console.error("Error searching for places:", error);
  }

  return [];
}

/**
 * Fetches detailed information for a specific Place ID.
 */
export async function getPlaceDetails(placeId: string): Promise<Academy | null> {
  if (typeof google === 'undefined' || !google.maps) return null;

  try {
    const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
    const place = new Place({ id: placeId });

    const detailFields = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'websiteUri',
      'rating',
      'userRatingCount',
      'photos',
      'internationalPhoneNumber'
    ];

    await place.fetchFields({ fields: detailFields });

    return {
      id: place.id,
      name: place.displayName || "Gracie Barra Academy",
      address: place.formattedAddress || "",
      city: "",
      state: "",
      zip: "",
      lat: place.location?.lat() || 0,
      lng: place.location?.lng() || 0,
      phone: place.internationalPhoneNumber || "",
      websiteUri: place.websiteUri || "",
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      photos: place.photos as any[] || [],
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}
