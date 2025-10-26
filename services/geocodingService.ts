// Using Nominatim (OpenStreetMap) - FREE, NO API KEY REQUIRED

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export class GeocodingService {
  private static readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';

  /**
   * Reverse geocode coordinates to get address using Nominatim
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    try {
      console.log('GeocodingService: Starting reverse geocoding for:', { latitude, longitude });
      
      // Build Nominatim API URL
      const url = `${this.NOMINATIM_BASE_URL}?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      
      console.log('GeocodingService: Calling Nominatim API:', url);
      
      // Make API call to Nominatim
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'E-Responde-Smartwatch/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.display_name) {
        throw new Error('No address found for coordinates');
      }

      // Extract address components
      const address = data.display_name || 'Address not available';
      const addressParts = data.address || {};
      
      const geocodingResult: GeocodingResult = {
        latitude,
        longitude,
        address: address,
        city: addressParts.city || addressParts.town || addressParts.village || 'Unknown City',
        country: addressParts.country || 'Unknown Country',
        postalCode: addressParts.postcode || 'Unknown Postal Code'
      };
      
      console.log('GeocodingService: Reverse geocoding successful:', geocodingResult);
      return geocodingResult;
      
    } catch (error) {
      console.error('GeocodingService: Reverse geocoding failed:', error);
      throw error; // Don't provide fallback, let it fail
    }
  }

  /**
   * Forward geocode address to get coordinates using Nominatim
   */
  static async forwardGeocode(address: string): Promise<GeocodingResult | null> {
    try {
      console.log('GeocodingService: Starting forward geocoding for:', address);
      
      // Build Nominatim API URL
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
      
      console.log('GeocodingService: Calling Nominatim API:', url);
      
      // Make API call to Nominatim
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'E-Responde-Smartwatch/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('No coordinates found for address');
      }

      const result = data[0];
      
      const geocodingResult: GeocodingResult = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name || address,
        city: 'Unknown City',
        country: 'Unknown Country',
        postalCode: 'Unknown Postal Code'
      };
      
      console.log('GeocodingService: Forward geocoding successful:', geocodingResult);
      return geocodingResult;
      
    } catch (error) {
      console.error('GeocodingService: Forward geocoding failed:', error);
      return null;
    }
  }
}