# Dataset Registry

This document tracks all datasets used in the ScamRoad project, their
licensing, provenance, and processing status.

> **Note:** Raw and processed datasets are stored in `data/` or cloud storage (Google Drive / Kaggle). This registry is the
> authoritative record of what data the project uses and under what terms (Rule R14).

---

## 1. Registry

| Source | Licence | URL / Handle | Version / Date | Classes | Class Mapping | Split Policy | Notes |
|---|---|---|---|---|---|---|---|
| **RDD2022 — India** | CC BY-SA 4.0 | [Figshare: 21431547](https://figshare.com/articles/dataset/RDD2022/21431547) | 2022-10 | D00, D10, D20, D40 | D40→POTHOLE (0), D00→CRACK_LONG (1), D10→CRACK_TRANS (2), D20→CRACK_ALLIGATOR (3) | 70/15/15 Sequence-aware stratified (seed=42) | Primary training set (~2 GB, 9,665 images). Attribution: Arya et al., IEEE BigData 2022. Checksummed in `ml/configs/data_checksums.yaml`. |
| **RDD2022 — Japan** | CC BY-SA 4.0 | [Figshare: 21431547](https://figshare.com/articles/dataset/RDD2022/21431547) | 2022-10 | D00, D10, D20, D40 | D40→0, D00→1, D10→2, D20→3 | External test holdout | Secondary benchmark (10,506 images). Evaluated on Kaggle GPU. |
| **RDD2022 — Kaggle Mirror** | CC BY-SA 4.0 | `aliabdelmenam/rdd-2022` | 2023 | D00, D10, D20, D40 | D40→0, D00→1, D10→2, D20→3 | Stratified sequence-aware | Fast cloud-native download directly inside Colab / Kaggle. |
| **MakeML Potholes** | CC0 / Public Domain | `larxel/pothole-detection` | 2021 | pothole | pothole→POTHOLE (0) | 70/15/15 Stratified | Diverse urban and highway pothole bounding boxes. |
| **IIT Bombay Indian Roads** | CC BY 4.0 | `e-yantra-iit-bombay/semantic-segmentation-datasets-of-indian-roads` | 2023 | road, pothole, footpath | pothole→POTHOLE (0) | 80/10/10 Split | Pixel-level semantic and instance segmentation of Indian road conditions. |
| **IIT Goa Potholes** | Research Use | `iitgoa/iit-goa-pothole-detection-classification-dataset` | 2023 | pothole | pothole→POTHOLE (0) | 70/15/15 Stratified | Rural and urban Indian road surfaces with variable lighting. |
| **Sample Benchmark** | CC0 / Internal | `scripts/seed/create_benchmark_sample.py` | 2026-10-31 | D40, D00 | D40→POTHOLE, D00→CRACK_LONG | 70/15/15 Sequence-aware | 30 images, 33 annotations. Full audit in `docs/DATASET_AUDIT.md`. |

---

## 2. Processing Pipeline Tools

1. **Download & Checksum Verification**:
   - Tool: `ml/data/download.py`
   - Manifest: `ml/configs/data_checksums.yaml`
   - Algorithm: SHA-256 chunked streaming and Kaggle API pull.
2. **Label Unification**:
   - Tool: `ml/data/convert.py`
   - Mapping: Pascal VOC XML and polygon segmentations clamped to $[0.0, 1.0]$, normalized to YOLO format.
   - Dropped Box Audit: logged in `ml/runs/audit/conversion_summary.json`.
3. **Data Audit**:
   - Tool: `ml/data/audit.py`
   - Verifications: Perceptual hash deduplication (pHash Hamming distance $\le 4$), SHA-256 duplicate detection, PIL image verification, COCO scale categories (small/medium/large).
   - Report: `docs/DATASET_AUDIT.md`.
4. **Sequence Splitting**:
   - Tool: `ml/data/split.py`
   - Strategy: Group contiguous frames by video drive sequence (default: 10 frames/sequence) to prevent background feature memorization.
   - Ultralytics Config: `data/processed/<dataset>/dataset.yaml`.

---

## 3. Adding a New Dataset

When adding a new dataset to the project:
1. **Verify the licence** permits research and development (CC BY-SA, Apache 2.0, MIT, CC0).
2. **Add an entry** to `ml/configs/data_checksums.yaml` with filename, URL or Kaggle handle, and metadata.
3. **Run `python -m ml.data.download --dataset <key>`** (or `--kaggle-dataset <handle>`).
4. **Run `python -m ml.data.convert`** and log any dropped classes.
5. **Run `python -m ml.data.audit`** and update `docs/DATASET_AUDIT.md`.
