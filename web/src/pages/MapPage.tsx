import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import {
  Filter,
  RefreshCw,
  MapPin,
  X,
} from "../components/Icons";
import { Link } from "react-router-dom";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  Severe: "#ea580c",
  Moderate: "#eab308",
  Minor: "#22c55e",
};

interface DefectProperties {
  id: string;
  class_code: string;
  severity_level: string;
  status: string;
  normalized_score: number | null;
  times_seen: number;
  latitude: number;
  longitude: number;
  road_name?: string;
  ward_name?: string;
}

export const MapPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [activeDefect, setActiveDefect] = useState<DefectProperties | null>(null);

  const {
    data: geojson,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["mapGeoJson", selectedSeverity, selectedStatus],
    queryFn: () => api.getMapGeoJson(selectedSeverity || undefined, selectedStatus || undefined),
    refetchInterval: 15000,
  });

  const totalMarkers = geojson?.features?.length || 0;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto relative">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{t("appName")}</span>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
              OpenStreetMap GIS Core
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive Road Defect GIS Map</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Geospatial surveillance rendering verified road distresses, multi-pass sighting clusters, and severity heatmap.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Severe">Severe</option>
            <option value="Moderate">Moderate</option>
            <option value="Minor">Minor</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAGED">TRIAGED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="REPAIRED">REPAIRED</option>
          </select>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Map Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-2 text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
            Severity Color Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block shadow-xs"></span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Critical (&ge;70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block shadow-xs"></span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Severe (50–69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block shadow-xs"></span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Moderate (25–49)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Minor (&lt;25)</span>
          </div>
        </div>
        <div className="font-medium text-slate-500 dark:text-slate-400">
          Mapped Geotagged Defects:{" "}
          <strong className="text-slate-900 dark:text-white font-mono text-sm">{totalMarkers}</strong>
        </div>
      </div>

      {/* Main Map Canvas & Defect Slide-Over Drawer */}
      <div className="h-[620px] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-md relative z-0">
        {isLoading && !geojson && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 z-20 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Loading Geospatial Layer...</span>
          </div>
        )}

        <MapContainer
          center={[30.901, 75.8573]} // Ludhiana / Punjab road corridor
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {geojson?.features?.map((feature: any) => {
            const coords = feature.geometry?.coordinates;
            if (!coords || coords.length < 2) return null;
            const [lon, lat] = coords;
            const props = feature.properties || {};
            const severityLevel = props.severity_level || "Minor";
            const color = SEVERITY_COLORS[severityLevel] || "#22c55e";

            return (
              <CircleMarker
                key={props.id}
                center={[lat, lon]}
                radius={Math.min(16, Math.max(8, (props.times_seen || 1) * 2 + 5))}
                fillColor={color}
                color="#ffffff"
                weight={2}
                opacity={1}
                fillOpacity={0.88}
                eventHandlers={{
                  click: () => {
                    setActiveDefect({
                      id: props.id,
                      class_code: props.class_code,
                      severity_level: severityLevel,
                      status: props.status,
                      normalized_score: props.normalized_score,
                      times_seen: props.times_seen,
                      latitude: lat,
                      longitude: lon,
                      road_name: props.road_name,
                      ward_name: props.ward_name,
                    });
                  },
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[210px] text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {props.class_code?.toUpperCase()}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white"
                        style={{ backgroundColor: color }}
                      >
                        {severityLevel}
                      </span>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <div>Status: <strong>{props.status}</strong></div>
                      <div>Score: <strong>{props.normalized_score ?? "N/A"}/100</strong></div>
                      <div>Multi-Pass Sightings: <strong>{props.times_seen}</strong></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Slide-Over Detail Drawer when a marker is clicked */}
        {activeDefect && (
          <div className="absolute top-4 right-4 z-[1000] w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xl transition-all animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[activeDefect.severity_level] || "#22c55e" }}
                />
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  {activeDefect.class_code?.toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setActiveDefect(null)}
                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Severity Level:</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                  style={{ backgroundColor: SEVERITY_COLORS[activeDefect.severity_level] || "#22c55e" }}
                >
                  {activeDefect.severity_level}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Damage Score:</span>
                <span className="font-black text-slate-900 dark:text-white font-mono">
                  {activeDefect.normalized_score ?? "N/A"} / 100
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Lifecycle Status:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {activeDefect.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Sighting Count:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                  {activeDefect.times_seen} passes (Deduplicated)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">GPS Coordinates:</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {activeDefect.latitude.toFixed(4)}° N, {activeDefect.longitude.toFixed(4)}° E
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <Link
                  to={`/defects?highlight=${activeDefect.id}`}
                  className="w-full text-center py-2 px-3 rounded-xl bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
                >
                  Open in Defect Registry
                </Link>
                <Link
                  to="/maintenance"
                  className="w-full text-center py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                >
                  View Work Orders
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
