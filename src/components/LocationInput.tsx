// src/components/LocationInput.tsx
import React, { useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface LocationInputProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
}

// Nominatim's `address` object breaks a result into components instead of one baked string.
// We only want area-level granularity (no house number/street), so build the display string
// from these fields rather than using `display_name`, which is house-level by default.
function toAreaLevelAddress(nominatimResult: any): string {
  const a = nominatimResult?.address ?? {};
  const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.city || a.county;
  const state = a.state;
  const parts = [area, state].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : nominatimResult?.display_name || '';
}

function friendlyGeolocationError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location access was denied — enable it in your browser settings to use this.';
    case err.POSITION_UNAVAILABLE:
      return "Couldn't determine your location right now. Try again or enter your address.";
    case err.TIMEOUT:
      return 'Location lookup took too long — try again.';
    default:
      return 'Something went wrong getting your location.';
  }
}

export function LocationInput({ onLocationSelect }: LocationInputProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // zoom=14 asks Nominatim for suburb/city-level granularity instead of the
          // building-level default (zoom=18) — matches what we actually want to show.
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`
          );
          const data = await res.json();
          const displayAddress = toAreaLevelAddress(data) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setAddress(displayAddress);
          onLocationSelect({ latitude: lat, longitude: lng, address: displayAddress });
        } catch {
          onLocationSelect({ latitude: lat, longitude: lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError(friendlyGeolocationError(err));
      },
      {
        enableHighAccuracy: true, // forces GPS over cell/WiFi triangulation where available
        timeout: 10000,
        maximumAge: 0, // never reuse a stale cached position
      }
    );
  };

  const handleManualSearch = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&countrycodes=ng`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        onLocationSelect({ latitude: lat, longitude: lng, address: toAreaLevelAddress(data[0]) });
      } else {
        setError('Location not found. Please try a different address.');
      }
    } catch {
      setError('Failed to look up address location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Your location</span>

      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          placeholder="Enter address, street, or city…"
          className="w-full rounded-2xl bg-white border border-pitch-black/10 px-4 py-3.5 text-pitch-black placeholder:text-slate/50 focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 transition-shadow"
        />
        <button
          type="button"
          onClick={handleManualSearch}
          disabled={loading}
          aria-label="Search address"
          className="shrink-0 grid place-items-center rounded-2xl bg-gold text-pitch-black px-4 hover:bg-gold-light active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      <button
        type="button"
        onClick={handleGetBrowserLocation}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-pill bg-pitch-black text-white font-bold py-3.5 px-6 hover:bg-petrol active:scale-[0.99] transition-all disabled:opacity-45 disabled:pointer-events-none"
      >
        <MapPin className="w-4 h-4" /> Use current location
      </button>

      {loading && <p className="text-sm text-slate">Detecting location…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}