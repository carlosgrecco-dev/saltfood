import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LiveTrackingMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  corPrimaria?: string;
}

/** Mapa ao vivo com Leaflet + tiles do OpenStreetMap — 100% gratuito, sem chave de API. */
const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ latitude, longitude, label, corPrimaria = '#f97316' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([latitude, longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:${corPrimaria};width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid white;font-size:16px;line-height:1;">🛵</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    if (label) marker.bindPopup(label);

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.panTo([latitude, longitude]);
  }, [latitude, longitude]);

  return <div ref={containerRef} className="w-full h-56 rounded-xl overflow-hidden" />;
};

export default LiveTrackingMap;
