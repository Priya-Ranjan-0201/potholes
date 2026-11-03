# ScamRoad — Local Road Damage Labeling & Collection Guide

Standard operating procedure for data collection, privacy anonymization, and CVAT annotation of Indian road defects (Punjab/Ludhiana and broader GT Road corridors).

---

## 1. Safety & Data Collection Protocol

### Equipment & Mount Setup
1. **Dashcam / Action Camera:** Minimum 1080p resolution at 30 fps or 60 fps. Mount centrally on the windshield inside the wiper sweep zone.
2. **Vibration Damping:** Use a rigid suction or adhesive ball mount to eliminate camera jitter on rough rural roads.
3. **Lighting & Weather:**
   - Optimal: Clear daylight or overcast (10:00 AM – 3:30 PM) to minimize extreme low-angle tree shadow streaks.
   - Separate adverse condition runs (rain/dusk) should be specifically tagged for the robustness test slice.
4. **Driver Safety:** Never touch or adjust recording gear while operating the vehicle. Keep all logging automated or passenger-operated.

---

## 2. Privacy Anonymization Policy (Rule 9)

All media ingested into persistent storage must pass through privacy blurring:
- **Vehicle License Plates:** Bounding box Gaussian blur ($\sigma \ge 15$).
- **Pedestrian Faces:** Bounding box Gaussian blur ($\sigma \ge 15$).
- **Audit Requirement:** Record blur recall on every collected video sequence.

---

## 3. Damage Class Definitions & Boundary Criteria

### Class 0: `POTHOLE` (Priority 1)
- **Definition:** Structural failure of asphalt/concrete creating a depression with defined fractured edges and depth below the road plane.
- **Bounding Box Tightness:** Box must enclose the entire fracture perimeter including loose aggregate edges, but exclude surrounding sound road.
- **What is NOT a Pothole:**
  - Manhole covers and utility iron plates (tag as background).
  - Repaired bitumen patches with smooth asphalt.
  - Tree shadows or tire skid marks.
  - Shallow surface discoloration without physical depth.

### Class 1: `CRACK_LONG` (Longitudinal Crack)
- **Definition:** Cracks running predominantly parallel to the travel lane direction (within $\pm 30^\circ$ of vehicle axis).

### Class 2: `CRACK_TRANS` (Transverse Crack)
- **Definition:** Cracks running predominantly perpendicular to the lane direction (across the travel corridor).

### Class 3: `CRACK_ALLIGATOR` (Alligator / Fatigue Cracking)
- **Definition:** Interconnected series of polygonal cracks resembling crocodile/alligator hide, indicating base course failure.

---

## 4. CVAT Workflow & Acceptance Protocol

1. **Pre-Labelling:** Model inferences generated via `python -m ml.data.prelabel` are pre-loaded into CVAT tasks.
2. **Human Verification:**
   - Verify every pre-generated box.
   - Accept correct boxes unchanged.
   - Adjust boundary coordinates if loose.
   - Delete false alarms.
   - Add missed defects.
3. **Acceptance Rate Logging:** The verification script logs:
   $$\text{Acceptance Rate} = \frac{\text{Unmodified Accepted Boxes}}{\text{Total Pre-labelled Boxes}} \times 100\%$$
4. **Local Holdout Split:**
   - Reserve $\ge 20\%$ of local data by distinct route/day as the untouched `LOCAL_TEST` set. Never train or tune hyperparameters on this slice.

