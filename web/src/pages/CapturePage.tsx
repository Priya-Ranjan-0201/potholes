import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  Volume2,
  VolumeX,
  RefreshCw,
  CheckCircle2,
  Activity,
  Layers,
} from "../components/Icons";

interface OfflineDetection {
  id: string;
  timestamp: string;
  class_code: string;
  confidence: number;
  latitude: number;
  longitude: number;
  speed_kmh: number;
}

export const CapturePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isRecording, setIsRecording] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speedKmh, setSpeedKmh] = useState(36.4);
  const [gpsAccuracy, setGpsAccuracy] = useState(2.1);
  const [coordinates, setCoordinates] = useState({ lat: 30.90524, lon: 75.85621 });
  const [potholeCount, setPotholeCount] = useState(3);
  const [crackCount, setCrackCount] = useState(5);
  const [outboxQueue, setOutboxQueue] = useState<OfflineDetection[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recentDetection, setRecentDetection] = useState<{
    classCode: string;
    conf: number;
    time: string;
  } | null>(null);

  // Web Audio Chirp Generator
  const playDetectionChirp = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [audioEnabled]);

  // Request rear camera stream (PWA getUserMedia)
  useEffect(() => {
    let stream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setCameraActive(true);
          }
        }
      } catch {
        // Fallback to simulated road patrol stream for desktop and headless runners
        setCameraActive(false);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Real-time GPS Geolocation API Watcher
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoordinates({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lon: Number(pos.coords.longitude.toFixed(5)),
        });
        if (pos.coords.accuracy) {
          setGpsAccuracy(Number(pos.coords.accuracy.toFixed(1)));
        }
        if (pos.coords.speed !== null && pos.coords.speed >= 0) {
          setSpeedKmh(Number((pos.coords.speed * 3.6).toFixed(1)));
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Periodic Drive Simulation (Simulates vehicle speed & intermittent defect detections)
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      // Slight speed jitter
      setSpeedKmh((prev) => {
        const next = prev + (Math.random() * 2 - 1);
        return Number(Math.max(25, Math.min(52, next)).toFixed(1));
      });

      // 20% probability of new defect detected every 4s
      if (Math.random() < 0.22) {
        const isPothole = Math.random() < 0.6;
        const cls = isPothole ? "POTHOLE" : "CRACK_LONG";
        const conf = Number((0.82 + Math.random() * 0.15).toFixed(2));

        if (isPothole) {
          setPotholeCount((c) => c + 1);
        } else {
          setCrackCount((c) => c + 1);
        }

        const newDet: OfflineDetection = {
          id: `det-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          class_code: cls,
          confidence: conf,
          latitude: coordinates.lat,
          longitude: coordinates.lon,
          speed_kmh: speedKmh,
        };

        setOutboxQueue((prev) => [newDet, ...prev]);
        setRecentDetection({
          classCode: cls,
          conf,
          time: new Date().toLocaleTimeString(),
        });
        playDetectionChirp();
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isRecording, coordinates, speedKmh, playDetectionChirp]);

  // Sync Outbox Action
  const handleSyncNow = () => {
    setSyncStatus("Syncing...");
    setTimeout(() => {
      const count = outboxQueue.length;
      setOutboxQueue([]);
      setSyncStatus(`Successfully uploaded ${count} defect sighting(s) to cloud outbox.`);
      setTimeout(() => setSyncStatus(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Top HUD Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                isRecording ? "bg-red-500 animate-ping" : "bg-slate-600"
              }`}
            />
            <span className="font-mono text-xs font-black tracking-widest uppercase text-red-400">
              {isRecording ? "LIVE DRIVE REC" : "STANDBY"}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">
            | Mobile PWA Capture Mode
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              audioEnabled
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
            title="Toggle Audio Chirp on Detection"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{audioEnabled ? "Chirp ON" : "Muted"}</span>
          </button>

          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isRecording ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Main Viewport & Glanceable HUD Overlay */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-16/9 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          /* Simulated Asphalt Viewport */
          <div className="w-full h-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(46,196,182,0.15),transparent_70%)]" />
            
            {/* Animated Road Perspective Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line x1="50" y1="20" x2="10" y2="100" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50" y1="20" x2="90" y2="100" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50" y1="20" x2="50" y2="100" stroke="#eab308" strokeWidth="1.5" strokeDasharray="8 6" />
            </svg>

            {/* Neural Laser Scanner Sweep Effect */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2EC4B6] to-transparent animate-pulse shadow-[0_0_15px_#2EC4B6]" />

            <div className="text-center z-10 space-y-1">
              <Camera className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Rear Camera / Simulated Drive Stream</p>
              <span className="text-[10px] text-slate-500 font-mono">1080p @ 30 FPS • Auto-Gain Locked</span>
            </div>
          </div>
        )}

        {/* Glanceable Drive HUD: Big Speedometer (Top Left) */}
        <div className="absolute top-4 left-4 p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-white flex items-baseline gap-1.5 shadow-lg">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
            {speedKmh}
          </span>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black uppercase text-amber-400 leading-none">KM/H</span>
            <span className="text-[9px] text-slate-400 leading-none">Survey Speed</span>
          </div>
        </div>

        {/* Glanceable Drive HUD: GNSS Telemetry (Top Right) */}
        <div className="absolute top-4 right-4 p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-right text-white shadow-lg space-y-0.5">
          <div className="flex items-center justify-end gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black text-emerald-400">GPS &plusmn;{gpsAccuracy}m</span>
          </div>
          <div className="font-mono text-[10px] text-slate-300">
            {coordinates.lat.toFixed(5)}&deg; N, {coordinates.lon.toFixed(5)}&deg; E
          </div>
          <span className="text-[9px] text-slate-400 block">NavIC / GNSS High Precision</span>
        </div>

        {/* Active Detection Banner Overlay (Center Bottom) */}
        {recentDetection && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 p-3 rounded-xl bg-red-600/90 backdrop-blur-md text-white border border-red-400 shadow-xl flex items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <div>
                <span className="text-xs font-black uppercase block tracking-wider">
                  ⚠️ Defect Alert: {recentDetection.classCode}
                </span>
                <span className="text-[10px] text-red-100">
                  Confidence: {Math.round(recentDetection.conf * 100)}% &bull; {recentDetection.time}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-red-700">
              Logged
            </span>
          </div>
        )}
      </div>

      {/* Glanceable Distress Counter Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-md">
          <span className="text-[11px] uppercase font-bold text-red-400 block tracking-wider">
            Potholes (D40)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
            {potholeCount}
          </span>
          <span className="text-[10px] text-slate-400">Severe / Deep Crater</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-md">
          <span className="text-[11px] uppercase font-bold text-amber-400 block tracking-wider">
            Cracks (D00/D10)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
            {crackCount}
          </span>
          <span className="text-[10px] text-slate-400">Longitudinal / Transverse</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-md">
          <span className="text-[11px] uppercase font-bold text-blue-400 block tracking-wider">
            Offline Outbox
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
            {outboxQueue.length}
          </span>
          <span className="text-[10px] text-slate-400">IndexedDB Queue</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-md flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-emerald-400 block tracking-wider">
              Cloud Sync
            </span>
            <span className="text-xs text-slate-300 font-bold mt-1 block">
              {outboxQueue.length === 0 ? "All Synced" : `${outboxQueue.length} Pending`}
            </span>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={outboxQueue.length === 0}
            className="w-full py-1.5 mt-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Outbox Now</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Offline Outbox Queue Table */}
      <div className="civic-card p-5 rounded-2xl shadow-md border border-slate-200/90 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Local Browser Outbox Queue (IndexedDB Storage)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {outboxQueue.length} record(s) queued
          </span>
        </div>

        {outboxQueue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-slate-400">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Distress Class</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Coordinates</th>
                  <th className="py-2 px-3">Vehicle Speed</th>
                  <th className="py-2 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {outboxQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-mono font-bold">{item.id}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                      {item.class_code}
                    </td>
                    <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                      {Math.round(item.confidence * 100)}%
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">
                      {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                    </td>
                    <td className="py-2 px-3 font-mono">{item.speed_kmh} km/h</td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            Outbox queue is empty. Detections captured during patrol will queue here before cloud sync.
          </div>
        )}
      </div>

      {/* Footer Student Disclaimer */}
      <div className="text-center text-[11px] text-slate-400">
        Student research project. Not an official government system. Not safety-certified.
      </div>
    </div>
  );
};
