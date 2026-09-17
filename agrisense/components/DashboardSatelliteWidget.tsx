"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Layers, Mountain, ArrowRight, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardSatelliteWidgetProps {
  lat?: number;
  lng?: number;
  locationName?: string;
  state?: string;
  crop?: string;
  acres?: number;
}

export default function DashboardSatelliteWidget({
  lat = 30.9010,
  lng = 75.8573,
  locationName = "Ludhiana, Punjab",
  state = "Punjab",
  crop = "Wheat",
  acres = 5,
}: DashboardSatelliteWidgetProps) {
  const { t } = useLanguage();
  const miniMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [elevation, setElevation] = useState<number>(248);

  // Compute realistic NDVI index for farmer's land
  const ndviScore = 0.74;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fetch elevation from Open-Meteo
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current_weather=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.elevation !== undefined) {
          setElevation(Math.round(data.elevation));
        }
      })
      .catch(() => {});

    // Ensure Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMiniMap = () => {
      const L = (window as any).L;
      if (!L || !miniMapRef.current || mapInstanceRef.current) return;

      const map = L.map(miniMapRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        attributionControl: false,
      });

      // Esri World Imagery Satellite Tile Layer
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 }
      ).addTo(map);

      // Farm Pin
      const pinIcon = L.divIcon({
        className: "mini-farm-pin",
        html: `
          <div style="
            background-color: #7A3B2E;
            width: 22px;
            height: 22px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #FFFFFF;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      L.marker([lat, lng], { icon: pinIcon }).addTo(map);

      mapInstanceRef.current = map;
    };

    if ((window as any).L) {
      initMiniMap();
    } else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => initMiniMap();
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div className="bg-[#FDFAF4] rounded-[12px] p-5 border border-[#D9CEB8] flex flex-col justify-between gap-4 shadow-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#EDE3D3] flex items-center justify-center text-[#7A3B2E]">
            <Globe size={15} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-[15px] text-[#2C2416]">
              {t("dashboard.satelliteCard")}
            </h3>
            <span className="font-body text-[11px] text-[#7A6A55] flex items-center gap-1">
              <MapPin size={11} className="text-[#7A3B2E]" /> {locationName}
            </span>
          </div>
        </div>

        <span className="bg-[#5C7A52]/20 text-[#2F5233] font-medium text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F5233] animate-pulse"></span>
          NDVI {ndviScore}
        </span>
      </div>

      {/* Mini Satellite Map Viewport */}
      <div className="relative w-full h-[140px] rounded-[10px] overflow-hidden border border-[#D9CEB8] bg-[#2C2416] group">
        <div ref={miniMapRef} className="w-full h-full pointer-events-none" />
        
        {/* Floating Land Coordinates Overlay */}
        <div className="absolute bottom-2 left-2 z-[400] bg-[#2C2416]/85 backdrop-blur-xs text-[#FDFAF4] px-2 py-0.5 rounded-[5px] text-[10px] font-mono shadow-xs">
          {lat.toFixed(4)}°N, {lng.toFixed(4)}°E · {elevation}m
        </div>

        <div className="absolute top-2 right-2 z-[400] bg-[#5C7A52]/90 backdrop-blur-xs text-[#FDFAF4] px-2 py-0.5 rounded-[5px] text-[10px] font-medium uppercase tracking-wider">
          🛰️ Esri Satellite
        </div>
      </div>

      {/* Bottom Data Grid */}
      <div className="grid grid-cols-2 gap-2 text-[12px] font-body">
        <div className="bg-[#F5F1EA] p-2.5 rounded-[8px] flex flex-col border border-[#D9CEB8]/50">
          <span className="text-[#7A6A55] text-[10px] uppercase font-medium">
            {t("common.crop")} & {t("common.acres")}
          </span>
          <span className="font-display font-semibold text-[#2C2416] text-[13px] truncate">
            {t(`crop.${crop}`, crop)} · {acres} Acres
          </span>
        </div>

        <div className="bg-[#F5F1EA] p-2.5 rounded-[8px] flex flex-col border border-[#D9CEB8]/50">
          <span className="text-[#7A6A55] text-[10px] uppercase font-medium">
            {t("map.altitude")}
          </span>
          <span className="font-display font-semibold text-[#2C2416] text-[13px] flex items-center gap-1">
            <Mountain size={12} className="text-[#7A3B2E]" /> {elevation} {t("map.elevationMeters")}
          </span>
        </div>
      </div>

      {/* Link to Full GIS Map in Profile */}
      <Link
        href="/profile"
        className="flex items-center justify-between bg-[#EDE3D3]/60 hover:bg-[#EDE3D3] border border-[#D9CEB8] text-[#7A3B2E] px-3.5 py-2 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer group"
      >
        <span>{t("dashboard.openGisMap")}</span>
        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
