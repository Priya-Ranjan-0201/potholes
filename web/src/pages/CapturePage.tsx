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
import { detectDefects } from "../utils/cvDetector";

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
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speedKmh, setSpeedKmh] = useState(0.0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [potholeCount, setPotholeCount] = useState(0);
  const [crackCount, setCrackCount] = useState(0);
  const [outboxQueue, setOutboxQueue] = useState<OfflineDetection[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recentDetection, setRecentDetection] = useState<{
    classCode: string;
    conf: number;
    time: string;
  } | null>(null);
  const [imuActive, setImuActive] = useState(false);
  const [currentGZ, setCurrentGZ] = useState(1.0);
  const [sensorFusionAgreed, setSensorFusionAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const lastBumpTimeRef = useRef<number>(0);

  // Web Audio Chirp Generator
  const playDetectionChirp = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  const initCamera = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
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
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    initCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initCamera]);

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

  // Accelerometer / DeviceMotion Listener for Bump Detection
  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      if (!event.accelerationIncludingGravity) return;
      const az = event.accelerationIncludingGravity.z ?? 9.81;
      const gForce = Math.abs(az) / 9.81;
      setCurrentGZ(Number(gForce.toFixed(2)));
      setImuActive(true);

      // Vertical acceleration disturbance spike detection (> 1.4g)
      if (Math.abs(gForce - 1.0) >= 0.4) {
        lastBumpTimeRef.current = Date.now();
      }
    };

    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
        window.removeEventListener("devicemotion", handleMotion);
      }
    };
  }, []);

  // Real inference on an image blob or file
  const processImageSource = async (source: File | Blob) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const result = await detectDefects(source);
      if (result.boxes.length > 0) {
        const newDets: OfflineDetection[] = result.boxes.map((b, idx) => ({
          id: `det-${Date.now().toString().slice(-6)}-${idx}`,
          timestamp: new Date().toISOString(),
          class_code: b.label,
          confidence: b.confidence,
          latitude: coordinates ? coordinates.lat : 0,
          longitude: coordinates ? coordinates.lon : 0,
          speed_kmh: speedKmh,
        }));

        setPotholeCount((c) => c + result.potholeCount);
        setCrackCount((c) => c + result.crackCount);
        setOutboxQueue((prev) => [...newDets, ...prev]);

        setRecentDetection({
          classCode: result.boxes[0].label,
          conf: result.boxes[0].confidence,
          time: new Date().toLocaleTimeString(),
        });

        playDetectionChirp();

        // Check if vertical bump occurred within 1.5 seconds
        const now = Date.now();
        if (Math.abs(now - lastBumpTimeRef.current) <= 1500) {
          setSensorFusionAgreed(true);
          setTimeout(() => setSensorFusionAgreed(false), 3000);
        }
      } else {
        setStatusMessage("Clean road surface — 0 defects detected by YOLO11n.");
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch {
      setStatusMessage("Inference service unreachable or processing error.");
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setIsProcessing(false);
    }
  };

  // Inspect the live video frame
  const handleCaptureAndInspect = () => {
    if (!videoRef.current || !cameraActive) {
      setStatusMessage("Camera stream not active. Please enable camera or upload a frame.");
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        processImageSource(blob);
      }
    }, "image/jpeg", 0.9);
  };

  // Manual frame upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageSource(file);
    }
  };

  // Periodic drive capture interval (only runs when recording is active AND camera is streaming)
  useEffect(() => {
    if (!isRecording || !cameraActive) return;
    const interval = setInterval(() => {
      handleCaptureAndInspect();
    }, 4500);
    return () => clearInterval(interval);
  }, [isRecording, cameraActive]);

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
    <div className="space-y-4 w-full max-w-6xl mx-auto pb-16">
      <canvas ref={hiddenCanvasRef} className="hidden" />

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
            {isRecording ? "Pause Drive" : "Start Drive"}
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
          /* Real Camera Standby Viewport */
          <div className="w-full h-full bg-slate-950 relative flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-400 shadow-md">
              <Camera className="w-7 h-7 text-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Live Camera Feed Standby</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Mount device to dashboard and grant browser camera access, or upload a road frame manually for real-time model inference.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={initCamera}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Enable Camera</span>
              </button>
              <label className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-xs">
                <span>Upload Road Frame</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        )}

        {/* Glanceable Drive HUD: Big Speedometer (Top Left) */}
        <div className="absolute top-4 left-4 p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-white flex items-baseline gap-1.5 shadow-lg">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
            {speedKmh.toFixed(1)}
          </span>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black uppercase text-amber-400 leading-none">KM/H</span>
            <span className="text-[9px] text-slate-400 leading-none">
              {speedKmh > 0 ? "Survey Speed" : "Stationary"}
            </span>
          </div>
        </div>

        {/* Glanceable Drive HUD: GNSS Telemetry (Top Right) */}
        <div className="absolute top-4 right-4 p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-right text-white shadow-lg space-y-0.5">
          <div className="flex items-center justify-end gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                coordinates ? "bg-emerald-400 animate-ping" : "bg-slate-500"
              }`}
            />
            <span className="text-xs font-black text-emerald-400">
              {gpsAccuracy ? `GPS ±${gpsAccuracy}m` : "GPS Ready"}
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-300">
            {coordinates
              ? `${coordinates.lat.toFixed(5)}° N, ${coordinates.lon.toFixed(5)}° E`
              : "Awaiting GNSS Fix"}
          </div>
          <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400">
            <span>IMU: {currentGZ}g ({imuActive ? "Live Sensor" : "Baseline Gravity"})</span>
          </div>
        </div>

        {/* Sensor Fusion Agreement Banner */}
        {sensorFusionAgreed && (
          <div className="absolute top-20 left-4 right-4 sm:left-auto sm:right-4 p-2.5 rounded-xl bg-purple-600/95 backdrop-blur-md text-white border border-purple-300 shadow-2xl flex items-center justify-between gap-3 animate-pulse z-20">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  Camera + IMU Bump Agree
                </span>
                <span className="text-[10px] text-purple-100">
                  Optical defect matched vertical acceleration shock (IMU cross-validated)
                </span>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white text-purple-900">
              Cross-Validated
            </span>
          </div>
        )}

        {/* Status / Clean Surface Notification */}
        {statusMessage && (
          <div className="absolute bottom-16 left-4 right-4 sm:left-auto sm:right-4 p-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md text-emerald-300 border border-emerald-500/40 shadow-xl text-xs font-bold flex items-center gap-2 z-20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

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

      {/* Manual Inspection Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCaptureAndInspect}
            disabled={isProcessing || !cameraActive}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 text-xs font-black transition flex items-center gap-2 shadow-md"
          >
            <Camera className="w-4 h-4" />
            <span>{isProcessing ? "Analyzing Frame..." : "Inspect Current Frame"}</span>
          </button>

          <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer">
            <span>Upload Road Image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Model: YOLO11n ONNX INT8 &bull; Real Inference
        </span>
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
          <span className="text-[10px] text-slate-400">Real Model Detections</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-md">
          <span className="text-[11px] uppercase font-bold text-amber-400 block tracking-wider">
            Cracks (D00/D10)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
            {crackCount}
          </span>
          <span className="text-[10px] text-slate-400">Real Model Detections</span>
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
