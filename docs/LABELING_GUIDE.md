# ScamRoad — Road Distress Annotation & Labeling Guide

**Standard:** YOLO Object Detection Format (`<class_id> <x_center> <y_center> <width> <height>`)  
**Single Source of Truth:** `shared/taxonomy.yaml`  
**Target Domain:** Indian Highway, Municipal, and Campus Pavements  

---

## 1. Class Taxonomy & Identification Criteria

| Class ID | Class Code | Taxonomy Name | Description & Key Visual Identifiers |
| :---: | :---: | :--- | :--- |
| **0** | **`D40`** | **Pothole** | Bowl-shaped cavity in asphalt surface where wearing course has ruptured and dislodged. Characterized by steep internal shadows, exposed aggregate sub-base, and sharp perimeter lips. |
| **1** | **`D00`** | **Longitudinal Crack** | Single structural crack line propagating parallel ($\pm 30^\circ$) to the direction of vehicular travel, commonly along paving seams, wheel tracks, or lane markings. |
| **2** | **`D10`** | **Transverse Crack** | Single crack line oriented predominantly perpendicular ($60^\circ\text{--}120^\circ$) across lane width, caused by thermal shrinkage cycles or reflective sub-grade shifting. |
| **3** | **`D20`** | **Alligator Crack** | Interconnected pattern of structural fatigue fissures forming a multi-sided polygonal mosaic (similar to reptilian skin). Indicates base course failure under heavy axle loads. |

---

## 2. Bounding Box Geometry Rules

1. **Tight Boundary Fit:**
   - Draw the bounding box tightly around the visible perimeter of the distress.
   - Include the outer perimeter lip and depth shadow of potholes.
   - For cracks, encompass the continuous fissure and immediate fractured asphalt edges.
2. **Minimum Resolution Threshold:**
   - **Minimum Bounding Box Dimension:** $\ge 20 \times 20\text{ pixels}$.
   - Defects smaller than $20\text{ pixels}$ occupying distant background ($>20\text{ m}$) must be ignored to prevent training noise.
3. **Multi-Fragment Disjoint Cracks:**
   - If a crack has a break $<15\text{ cm}$ (or $<25\text{ pixels}$ on screen), encapsulate it within a single bounding box.
   - If the separation exceeds $15\text{ cm}$, annotate as two separate crack instances.
4. **Alligator Crack Area Grouping:**
   - Annotate the entire contiguous polygonal cluster as a single `crack_alligator` (`D20`) bounding box. Do not draw dozens of tiny boxes over individual cells.

---

## 3. Disambiguation of Ambiguous Edge Cases (Crucial for Viva)

### Edge Case A: Bitumen Patch vs. Pothole
- **Bitumen Patch (Negative / Non-Defect):** Fresh or weathered asphalt applied during municipal repairs. Surface is raised or coplanar with the road, exhibiting flat granular texture without an internal depression shadow.
- **Rule:** **DO NOT label bitumen patches as potholes.** If unannotated, leave as background or mine as a hard-negative.

### Edge Case B: Cast-Iron Manhole Cover vs. Pothole
- **Manhole Cover (Negative / Non-Defect):** Circular or rectangular metallic utility access cover. Displays concentric iron ridges, metallic luster, and level road grade.
- **Rule:** **DO NOT label manhole covers as potholes.** Save in hard-negative training set with a $0$-byte label file.

### Edge Case C: Bridge Expansion Joint vs. Transverse Crack
- **Expansion Joint (Negative / Non-Defect):** Uniform, straight linear seam running completely across the road deck, often reinforced with metal teeth or rubber elastomeric sealants.
- **Rule:** **DO NOT label expansion joints as transverse cracks.**

### Edge Case D: Tree / Building Shadow vs. Longitudinal Crack
- **Shadow Edge (Negative / Non-Defect):** Linear illumination drop caused by sunlight occlusions. Has a soft penumbra gradient and continuous road texture beneath the shadow.
- **Rule:** **DO NOT label shadow edges as cracks.**

---

## 4. File Format & Directory Structure

Each image file `sample_name.jpg` has an associated `sample_name.txt` label file in the adjacent `labels/` directory:

```
data/local_sample/
├── images/
│   ├── campus_01.jpg
│   └── campus_02.jpg
└── labels/
    ├── campus_01.txt
    └── campus_02.txt
```

Each line in `sample_name.txt` contains 5 space-delimited floats normalized to $[0.0, 1.0]$:
```
<class_id> <x_center> <y_center> <width> <height>
```
*Example:*
```
0 0.452100 0.683400 0.124500 0.089200
1 0.781200 0.542000 0.045000 0.285000
```

> **Background Images (Negative Samples):** If an image contains zero defects (e.g. clean surface, shadow, or manhole), the corresponding `.txt` file must be created with **0 bytes (empty)**.
