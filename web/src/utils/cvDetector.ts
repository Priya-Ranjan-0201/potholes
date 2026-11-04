/**
 * Real-Time ScamRoad Computer Vision Edge & API Detector
 * Automatically connects to the local YOLO11n backend inference engine.
 * Includes resilient in-browser surface depression and edge gradient fallback.
 */

export interface DefectBox {
  id: string;
  label: "POTHOLE" | "CRACK_LONG" | "CRACK_TRANS" | "CRACK_ALLIGATOR";
  confidence: number;
  box: [number, number, number, number]; // [x%, y%, w%, h%]
  severity: "Critical" | "Severe" | "Moderate" | "Minor";
  score: number; // 0 - 100
  areaPx: number;
  action?: string;
}

export interface InspectionResult {
  source: "neural_api" | "edge_cv";
  totalDefects: number;
  potholeCount: number;
  crackCount: number;
  maxSeverity: "Critical" | "Severe" | "Moderate" | "Minor";
  overallScore: number;
  boxes: DefectBox[];
  latencyMs: number;
}

/**
 * Runs defect detection on an image (File, Blob, or base64 Data URL)
 */
export async function detectDefects(
  imageSource: File | Blob | string
): Promise<InspectionResult> {
  const startTime = performance.now();

  // 1. Try Backend YOLO Inference API (/api/v1/infer)
  try {
    let blob: Blob;
    if (typeof imageSource === "string") {
      const res = await fetch(imageSource);
      blob = await res.blob();
    } else {
      blob = imageSource;
    }

    const formData = new FormData();
    formData.append("file", blob, "upload.jpg");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const apiRes = await fetch("/api/v1/infer", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const latency = Math.round(performance.now() - startTime);

      const boxes: DefectBox[] = (data.detections || []).map((d: any) => ({
        id: d.id,
        label: d.label,
        confidence: d.confidence,
        box: d.box as [number, number, number, number],
        severity: d.severity,
        score: d.score,
        areaPx: d.areaPx,
        action: d.action,
      }));

      return {
        source: "neural_api",
        totalDefects: data.total_defects ?? boxes.length,
        potholeCount: data.pothole_count ?? boxes.filter((b) => b.label === "POTHOLE").length,
        crackCount: data.crack_count ?? boxes.filter((b) => b.label !== "POTHOLE").length,
        maxSeverity: data.max_severity || (boxes.length > 0 ? boxes[0].severity : "Minor"),
        overallScore: data.overall_health_score ?? (boxes.length > 0 ? boxes[0].score : 15),
        boxes,
        latencyMs: latency,
      };
    }
  } catch (err) {
    // API unavailable or timed out; smoothly fall back to edge CV
    console.info("[ScamRoad CV] Using edge browser analyzer fallback:", err);
  }

  // 2. Fallback: In-Browser Edge Surface Analysis via Canvas
  const edgeBoxes = await runBrowserEdgeDetection(imageSource);
  const latency = Math.round(performance.now() - startTime);

  const potholeCount = edgeBoxes.filter((b) => b.label === "POTHOLE").length;
  const crackCount = edgeBoxes.length - potholeCount;
  const maxSeverity =
    edgeBoxes.find((b) => b.severity === "Critical")?.severity ||
    edgeBoxes.find((b) => b.severity === "Severe")?.severity ||
    (edgeBoxes.length > 0 ? "Moderate" : "Minor");

  const overallScore =
    edgeBoxes.length > 0
      ? Math.max(...edgeBoxes.map((b) => b.score))
      : 15;

  return {
    source: "edge_cv",
    totalDefects: edgeBoxes.length,
    potholeCount,
    crackCount,
    maxSeverity,
    overallScore,
    boxes: edgeBoxes,
    latencyMs: latency,
  };
}

/**
 * In-browser computer vision analysis using HTML5 canvas
 * Analyzes localized darkness depressions and edge gradients
 */
async function runBrowserEdgeDetection(
  imageSource: File | Blob | string
): Promise<DefectBox[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = 320; // scale down for instant edge processing
        const h = Math.round((img.height / img.width) * w);
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve([]);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Convert to grayscale & compute road surface average luminance
        const gray = new Float32Array(w * h);
        let roadLumaSum = 0;
        let roadPixelCount = 0;

        const startY = Math.floor(h * 0.25); // road horizon line
        for (let y = startY; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            gray[y * w + x] = luma;
            roadLumaSum += luma;
            roadPixelCount++;
          }
        }

        const avgLuma = roadPixelCount > 0 ? roadLumaSum / roadPixelCount : 128;
        // Pothole depression threshold: pixels significantly darker than surrounding road
        const thresh = avgLuma * 0.72;

        // Grid-based depression clustering
        const cellSize = 12;
        const cols = Math.floor(w / cellSize);
        const rows = Math.floor(h / cellSize);
        const grid = new Float32Array(rows * cols);

        for (let r = Math.floor(rows * 0.22); r < rows; r++) {
          // Perspective road trapezoid: tapers towards horizon
          const progress = (r - rows * 0.22) / (rows * 0.78);
          const minColPct = 0.32 - progress * 0.24; // 32% at top -> 8% at bottom
          const maxColPct = 0.68 + progress * 0.26; // 68% at top -> 94% at bottom
          const startCol = Math.floor(cols * minColPct);
          const endCol = Math.floor(cols * maxColPct);

          for (let c = startCol; c < endCol; c++) {
            let darkCount = 0;
            let variance = 0;
            for (let dy = 0; dy < cellSize; dy++) {
              for (let dx = 0; dx < cellSize; dx++) {
                const px = c * cellSize + dx;
                const py = r * cellSize + dy;
                if (px < w && py < h) {
                  const val = gray[py * w + px];
                  if (val < thresh) darkCount++;
                  variance += Math.abs(val - avgLuma);
                }
              }
            }
            const ratio = darkCount / (cellSize * cellSize);
            grid[r * cols + c] = ratio > 0.35 ? ratio + variance / 2000 : 0;
          }
        }

        // Identify local clusters
        const clusters: Array<{ minC: number; maxC: number; minR: number; maxR: number; weight: number }> = [];
        const visited = new Uint8Array(rows * cols);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            if (grid[idx] > 0.4 && !visited[idx]) {
              // BFS cluster
              let minC = c, maxC = c, minR = r, maxR = r;
              let clusterWeight = 0;
              const queue = [[r, c]];
              visited[idx] = 1;

              while (queue.length > 0) {
                const [currR, currC] = queue.shift()!;
                clusterWeight += grid[currR * cols + currC];
                minC = Math.min(minC, currC);
                maxC = Math.max(maxC, currC);
                minR = Math.min(minR, currR);
                maxR = Math.max(maxR, currR);

                const neighbors = [
                  [currR - 1, currC],
                  [currR + 1, currC],
                  [currR, currC - 1],
                  [currR, currC + 1],
                ];

                for (const [nr, nc] of neighbors) {
                  if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const nidx = nr * cols + nc;
                    if (!visited[nidx] && grid[nidx] > 0.35) {
                      visited[nidx] = 1;
                      queue.push([nr, nc]);
                    }
                  }
                }
              }

              if (maxC - minC >= 1 || maxR - minR >= 1) {
                clusters.push({ minC, maxC, minR, maxR, weight: clusterWeight });
              }
            }
          }
        }

        // Format candidate boxes
        clusters.sort((a, b) => b.weight - a.weight);
        const boxes: DefectBox[] = [];

        for (let i = 0; i < Math.min(6, clusters.length); i++) {
          const cl = clusters[i];
          const pxLeft = cl.minC * cellSize;
          const pxTop = cl.minR * cellSize;
          const pxW = (cl.maxC - cl.minC + 1) * cellSize;
          const pxH = (cl.maxR - cl.minR + 1) * cellSize;

          const xPct = Math.round((pxLeft / w) * 100);
          const yPct = Math.round((pxTop / h) * 100);
          const wPct = Math.min(35, Math.max(6, Math.round((pxW / w) * 100)));
          const hPct = Math.min(28, Math.max(5, Math.round((pxH / h) * 100)));

          const confidence = Math.min(0.96, Math.max(0.72, 0.70 + (cl.weight / 15) * 0.24));
          const areaPx = Math.round((wPct / 100) * (hPct / 100) * img.width * img.height * 0.05);

          const severity =
            confidence > 0.88 || areaPx > 1800
              ? "Critical"
              : confidence > 0.75
              ? "Severe"
              : "Moderate";

          boxes.push({
            id: `det-${i + 1}`,
            label: "POTHOLE",
            confidence: Number(confidence.toFixed(3)),
            box: [xPct, yPct, wPct, hPct],
            severity,
            score: Math.round(confidence * 65 + Math.min(35, (areaPx / 2000) * 35)),
            areaPx,
            action:
              severity === "Critical"
                ? "Immediate 24-hr cold asphalt compaction"
                : "48-hr bituminous seal",
          });
        }

        resolve(boxes);
      } catch (e) {
        console.error("[ScamRoad CV] Edge analysis error:", e);
        resolve([]);
      }
    };

    img.onerror = () => resolve([]);

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

