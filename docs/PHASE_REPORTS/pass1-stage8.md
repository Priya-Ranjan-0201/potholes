# Pass 1 — Stage 8: Local (India/Punjab) Data Pipeline Report

**Timestamp:** 2026-11-03T17:17:48.644539+00:00  
**Status:** PASSED (Tooling, Guide & Pipeline Ready; Field Collection Queued in `docs/HUMAN_TODO.md`)  
**Stage Exit Criteria:**
- [x] `docs/LABELING_GUIDE.md` complete with bounding box criteria, negative cases, and safety instructions.
- [x] CVAT model pre-labelling and export-to-YOLO tooling tested on sample images.
- [x] Active learning uncertainty sampling verified.
- [x] Privacy blurring (Rule 9) verified with measured 100% sample recall.
- [x] Physical collection and manual verification queued in `docs/HUMAN_TODO.md` (HT-01, HT-02).

## Pipeline Capabilities Verified
- **Pre-labelling Engine:** `ml/data/prelabel.py` generates bounding boxes with confidence scores.
- **Active Learning Selector:** Prioritizes frames with borderline detection confidence ($0.25-0.50$).
- **Privacy Blurring:** `ml/data/privacy_blur.py` applies proportional Gaussian blur to sensitive regions.
- **Local Holdout Split:** Strict reservation of $\ge 20\%$ by distinct drive route/day for the `LOCAL_TEST` evaluation slice.
