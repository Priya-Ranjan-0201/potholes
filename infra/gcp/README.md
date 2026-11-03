# ScamRoad — Google Cloud Deployment & Interruption-Proof Resume Guide

This guide documents deploying and running ScamRoad on Google Cloud platforms (**Google Colab**, **Vertex AI**, and **Google Compute Engine**), ensuring seamless checkpoint persistence and automatic session resumption after any interruption.

---

## 1. Google Colab (Primary GPU Runtime)

ScamRoad provides a turnkey Google Colab pipeline with full session resume capability:
- **Notebook:** [`notebooks/ScamRoad_Colab_GPU_Pipeline.ipynb`](../../notebooks/ScamRoad_Colab_GPU_Pipeline.ipynb)
- **Direct 1-Click Link:** [Open in Google Colab](https://colab.research.google.com/github/Priya-Ranjan-0201/potholes/blob/main/notebooks/ScamRoad_Colab_GPU_Pipeline.ipynb)
- **Persistent Hub:** Google Drive at `/content/drive/MyDrive/ScamRoad/`

### How the Interruption-Proof Resume Engine Works:
1. **Persistent State Hub (`pipeline_state.json`):** Tracks the completion status of all dataset splits, models, benchmarks, and ONNX exports in Google Drive.
2. **Drive Dataset Cache:** Dataset splits generated in Step 6 are cached to `/content/drive/MyDrive/ScamRoad/datasets/splits/`. On session reconnect, the dataset is restored in 3 seconds, bypassing re-downloads.
3. **Training Auto-Resume (`resume=True`):**
   - If a model is already trained and has `best.pt`, training is skipped.
   - If training was interrupted mid-run, `last.pt` is detected and training immediately resumes from the exact interrupted epoch.
4. **Anti-Disconnect Keep-Alive:** To prevent Colab from disconnecting during long runs when the browser tab is idle, open Developer Tools (F12) in Chrome, select **Console**, and run:
   ```javascript
   function ClickConnect(){
     console.log("Colab Keep-Alive active");
     document.querySelector("colab-connect-button")?.click();
   }
   setInterval(ClickConnect, 60000);
   ```

---

## 2. Google Compute Engine (Deep Learning VM)

Deploy ScamRoad on a dedicated Google Compute Engine VM with an NVIDIA Tesla T4 GPU:

```bash
# 1. Create a GPU-accelerated GCE VM with startup script
gcloud compute instances create scamroad-gpu-worker \
    --zone=us-central1-a \
    --machine-type=n1-standard-4 \
    --accelerator=type=nvidia-tesla-t4,count=1 \
    --image-family=common-cu121-debian-11 \
    --image-project=deeplearning-platform-release \
    --maintenance-policy=TERMINATE \
    --metadata-from-file=startup-script=infra/gcp/startup_gce_gpu.sh \
    --metadata=GCS_BUCKET=gs://YOUR_BUCKET_NAME \
    --scopes=cloud-platform
```

The VM executes `startup_gce_gpu.sh`, pulls checkpoints from Cloud Storage, resumes training, and synchronizes updated models back to GCS upon completion.

---

## 3. Google Cloud Vertex AI (Serverless Custom Training)

Launch managed training jobs on Vertex AI using the Python dispatcher:

```bash
# Submit custom training job to Vertex AI
python infra/gcp/deploy_vertex_ai.py \
    --project-id YOUR_GCP_PROJECT_ID \
    --region us-central1 \
    --bucket YOUR_GCS_BUCKET \
    --accelerator NVIDIA_TESLA_T4
```

Vertex AI automatically manages VM provisioning, executes the resumable pipeline, and logs all outputs to Google Cloud Storage.

