# PART D — DATASET PLAN (docs/DATASETS_PLAN.md)

Rule: verify each source's current availability, licence and class definitions yourself before use; record in `docs/DATASETS.md`; download by script with SHA-256 checks; never commit raw data.

## D1. Detection (primary)
| Source | Search phrase | Where | Notes |
|---|---|---|---|
| **RDD2022** (verified) | `RDD2022 Road Damage Dataset figshare` | Figshare, GitHub `sekilab/RoadDamageDetector`, datasetninja.com | 47,420 images, six countries incl. India (~9,665 images), classes D00/D10/D20/D40, CC BY-SA 4.0 (share-alike: honour in README and in derived datasets) |
| RDD2020 | `RDD2020 road damage dataset` | Figshare, Mendeley | Mostly redundant; use only if needed |
| RDD-India (Roboflow) | `RDD-India roboflow universe` | universe.roboflow.com | Small supplement; classes D00, D20, D40, D44 — map D44 explicitly or drop |
| Pothole sets | `pothole detection dataset yolo` | Roboflow Universe, Kaggle | Check licence, label quality, duplicates vs RDD |
| Indian road damage | `Indian road damage dataset potholes cracks` | Kaggle, Mendeley Data, Roboflow | Local-domain supplement |

## D2. Segmentation
CRACK500 (`CRACK500 pavement crack dataset`), DeepCrack (`DeepCrack dataset crack segmentation`), CFD (`CrackForest dataset CFD`), pothole segmentation sets (`pothole segmentation dataset roboflow`), road-surface/drivable masks (`Indian Driving Dataset IDD segmentation`, `BDD100K drivable area`).

## D3. Scarce classes
`flooded road dataset`, `waterlogging road detection dataset`, `manhole cover detection dataset`, `road marking detection dataset faded lane`, `speed bump detection dataset` on Roboflow/Kaggle. If evidence is thin → `LIMITED_DATA` or `NOT_AVAILABLE`.

## D4. Conditions and negatives
`BDD100K night rain`, `IDD-AW adverse weather`; mine hard negatives from your own false positives (shadows, patches, stains, puddles, markings, manholes).

## D5. Geo and weather
OSM via Geofabrik India extract or Overpass; ward/district boundaries (`India ward boundaries geojson`, data.gov.in, local municipal open data); Open-Meteo historical API, NASA POWER.

## D6. Your own data (highest value)
Collect Ludhiana/Punjab drives: dashcam/phone video at a fixed mount, daylight + dusk + rain where safe, multiple passes over the same roads, GPS logs. Annotate in CVAT with the written labelling guide (`docs/LABELING_GUIDE.md`: class definitions, edge cases, minimum box size, occlusion rules, two-annotator protocol for severity). Reserve ≥20% of local data as an untouched local test set. Respect privacy (R15) and local laws; no filming that requires unsafe driving.

## D7. Pipeline order
RDD2022 baseline → add pothole sets after dedup and label audit → hard-negative round → local fine-tune → evaluate on (a) RDD India test, (b) local test, (c) video false-positives-per-km → export/quantize → device benchmark. Report every step's numbers from generated files.
