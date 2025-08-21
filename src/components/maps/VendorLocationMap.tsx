import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VendorLocationMapProps {
  vendorName: string;
  location: string;
  className?: string;
}

const VendorLocationMap = ({ vendorName, location, className }: VendorLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeMap();
  }, [location]);

  const initializeMap = async () => {
    if (!mapRef.current || !location) return;

    try {
      setLoading(true);
      setError(null);

      const loader = new Loader({
        apiKey: 'AIzaSyD4BlpcSYMEeggVC--6v_ltyBC0QszxVPc',
        version: 'weekly',
        libraries: ['places', 'geometry', 'marker']
      });

      const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;
      const { Geocoder } = await loader.importLibrary('geocoding') as google.maps.GeocodingLibrary;

      // Default to Accra, Ghana coordinates
      let coordinates = { lat: 5.6037, lng: -0.1870 };
      
      // Try to geocode the location
      const geocoder = new Geocoder();
      try {
        const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: location }, (results, status) => {
            if (status === 'OK' && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        if (results && results[0]) {
          coordinates = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed, using default coordinates:', geocodeError);
      }

      // Create map
      const mapInstance = new Map(mapRef.current, {
        center: coordinates,
        zoom: 15,
        mapTypeId: 'roadmap',
        mapId: 'DEMO_MAP_ID',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      // Create marker
      const markerInstance = new AdvancedMarkerElement({
        position: coordinates,
        map: mapInstance,
        title: `${vendorName} - ${location}`,
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">${vendorName}</h3>
            <p style="margin: 0; color: #666;">${location}</p>
          </div>
        `
      });

      markerInstance.addListener('click', () => {
        infoWindow.open(mapInstance, markerInstance);
      });

      setMap(mapInstance);
      setMarker(markerInstance);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to load map. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = () => {
    const query = encodeURIComponent(`${vendorName} ${location}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  const getDirections = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        const destination = encodeURIComponent(location);
        const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
        window.open(url, '_blank');
      }, () => {
        // Fallback if geolocation fails
        const destination = encodeURIComponent(location);
        const url = `https://www.google.com/maps/dir//${destination}`;
        window.open(url, '_blank');
      });
    } else {
      const destination = encodeURIComponent(location);
      const url = `https://www.google.com/maps/dir//${destination}`;
      window.open(url, '_blank');
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <p className="font-medium">{vendorName}</p>
              <p className="text-sm text-muted-foreground">{location}</p>
              <Button onClick={openInGoogleMaps} variant="outline" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                View on Google Maps
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location
          </div>
          <div className="flex space-x-2">
            <Button onClick={getDirections} variant="outline" size="sm">
              <Navigation className="w-4 h-4 mr-2" />
              Directions
            </Button>
            <Button onClick={openInGoogleMaps} variant="outline" size="sm">
              <MapPin className="w-4 h-4 mr-2" />
              View Larger
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <div 
              ref={mapRef} 
              className="w-full h-64 rounded-lg border"
              style={{ minHeight: '256px' }}
            />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">{vendorName}</p>
              <p>{location}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorLocationMap;
