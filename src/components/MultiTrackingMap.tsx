import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapaMarcador {
  id: string;
  latitude: number;
  longitude: number;
  emoji?: string;
  cor?: string;
  label?: string;
}

interface MultiTrackingMapProps {
  marcadores: MapaMarcador[];
  alturaClasse?: string;
}

/** Variante do LiveTrackingMap com vários marcadores ao mesmo tempo — mesma stack (Leaflet +
 * tiles do OpenStreetMap, sem chave de API), usada em Entregas e Logística pra mostrar todos os
 * motoboys/pedidos num mapa só, em vez de um marcador único como no acompanhamento do cliente. */
const MultiTrackingMap: React.FC<MultiTrackingMapProps> = ({ marcadores, alturaClasse = 'h-[420px]' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const grupoRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([-12.9, -38.5], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    grupoRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      grupoRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const grupo = grupoRef.current;
    if (!map || !grupo) return;

    grupo.clearLayers();

    marcadores.forEach((m) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${m.cor || '#f97316'};width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid white;font-size:16px;line-height:1;">${m.emoji || '🛵'}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([m.latitude, m.longitude], { icon });
      if (m.label) marker.bindPopup(m.label);
      marker.addTo(grupo);
    });

    if (marcadores.length > 0) {
      const bounds = L.latLngBounds(marcadores.map((m) => [m.latitude, m.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [marcadores]);

  return <div ref={containerRef} className={`w-full ${alturaClasse} rounded-xl overflow-hidden`} />;
};

export default MultiTrackingMap;
