// src/components/LocationInput.tsx
import React, { useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { reverseGeocode, searchGeocode, GeocodeResult } from '../lib/geocodingApi';
import { ConfirmLocationModal } from './ConfirmLocationModal';

interface LocationInputProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
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
  // Holds a low-confidence result while it's awaiting explicit user confirmation.
  const [pendingConfirmation, setPendingConfirmation] = useState<GeocodeResult | null>(null);

  const acceptResult = (result: GeocodeResult) => {
    setAddress(result.formattedAddress);
    onLocationSelect({ latitude: result.latitude, longitude: result.longitude, address: result.formattedAddress });
  };

  const handleResult = (result: GeocodeResult) => {
    if (result.lowConfidence) {
      // Don't silently fill the field with a weak match — make the user confirm it first.
      setPendingConfirmation(result);
    } else {
      acceptResult(result);
    }
  };

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
          const result = await reverseGeocode(lat, lng);
          handleResult(result);
        } catch {
          // Geocoding failed outright (not just low-confidence) — fall back to raw
          // coordinates rather than blocking the user, same behavior as before.
          const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setAddress(fallbackAddress);
          onLocationSelect({ latitude: lat, longitude: lng, address: fallbackAddress });
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
      const result = await searchGeocode(address);
      handleResult(result);
    } catch {
      setError('Location not found. Please try a different address.');
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

      {pendingConfirmation && (
        <ConfirmLocationModal
          address={pendingConfirmation.formattedAddress}
          onConfirm={() => {
            acceptResult(pendingConfirmation);
            setPendingConfirmation(null);
          }}
          onReject={() => {
            setPendingConfirmation(null);
            setAddress('');
          }}
        />
      )}
    </div>
  );
}