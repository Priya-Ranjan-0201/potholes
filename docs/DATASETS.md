# Dataset Registry

This document tracks all datasets used in the ScamRoad project, their
licensing, provenance, and processing status.

> **Note:** Datasets are stored in `data/` (git-ignored). This registry is the
> authoritative record of what data the project uses and under what terms.

---

## Registry

| Source | Licence | URL | Version / Date | Classes | Class Mapping | Split Policy | Notes |
|--------|---------|-----|---------------|---------|---------------|-------------|-------|
| RDD2022 — India | CC BY-SA 4.0 | [Figshare: 21431547](https://figshare.com/articles/dataset/RDD2022/21431547) | 2022-10 (original release) | D00, D10, D20, D40 | D00→0, D10→1, D20→2, D40→3 | 70/15/15 stratified (seed=42) | Primary training set. ~2 GB. VOC XML labels converted to YOLO TXT. Attribution: Arya et al., IEEE BigData 2022. |

---

## Adding a New Dataset

When adding a new dataset to the project:

1. **Verify the licence** permits use for this project (research + potential
   open-source release under MIT/Apache-2.0).
2. **Add a row** to the registry table above with all columns filled.
3. **Record the SHA-256 checksum** of the downloaded archive in
   `configs/data_checksums.yaml`.
4. **Write a conversion script** if the label format differs from YOLO TXT.
5. **Update `configs/class_map.yaml`** if the dataset introduces new classes.
6. **Run EDA** and document any quality issues.
7. **Log an ADR** in `docs/DECISIONS.md` if the dataset significantly changes
   training scope or strategy.
