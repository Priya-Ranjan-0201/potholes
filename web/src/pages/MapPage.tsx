import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { api } from "../api/client";
import { Filter, Layers, RefreshCw, AlertTriangle, CheckCircle, ExternalLink } from "../components/Icons";
import { Link } from "react-router-dom";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  Severe: "#ea580c",
  Moderate: "#eab308",
  Minor: "#22c55e",
};

export const MapPage: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

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

  return (
    <div className="space-y-4 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Interactive Geospatial Defect Map
          </h1>
          <p className="text-xs text-slate-500">
            OpenStreetMap GIS layer rendering verified canonical defects &amp; road snapping (Rule B8).
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Map Legend */}
      <div className="flex items-center justify-between text-xs px-2 text-slate-600">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
            Severity Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block shadow-xs"></span>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block shadow-xs"></span>
            <span>Severe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block shadow-xs"></span>
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
            <span>Minor</span>
          </div>
        </div>
        <div className="font-medium text-slate-400">
          Total Mapped Markers:{" "}
          <strong className="text-slate-800">{geojson?.features?.length || 0}</strong>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="h-[620px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
        {isLoading && !geojson && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        )}

        <MapContainer
          center={[30.901, 75.8573]} // Punjab / Ludhiana center
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
                radius={Math.min(14, Math.max(7, (props.times_seen || 1) * 2 + 5))}
                fillColor={color}
                color="#ffffff"
                weight={2}
                opacity={1}
                fillOpacity={0.85}
              >
                <Popup>
                  <div className="p-1 min-w-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        {props.class_code === "pothole" || props.class_code === "POTHOLE" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                        {props.class_code?.toUpperCase()}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white"
                        style={{ backgroundColor: color }}
                      >
                        {severityLevel}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div>
                        Status:{" "}
                        <strong
                          className={
                            props.status === "REPAIRED" ? "text-emerald-600" : "text-amber-600"
                          }
                        >
                          {props.status}
                        </strong>
                      </div>
                      <div>
                        Normalized Score: <strong>{props.normalized_score ?? "N/A"}/100</strong>
                      </div>
                      <div>
                        Sightings (Multi-Pass): <strong>{props.times_seen}</strong>
                      </div>
                      <div>
                        Coordinates:{" "}
                        <span className="font-mono text-[11px]">
                          {lat.toFixed(5)}, {lon.toFixed(5)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                      <Link
                        to={`/defects?highlight=${props.id}`}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        Inspect Defect <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
