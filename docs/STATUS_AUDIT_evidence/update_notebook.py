import json

with open('notebooks/ScamRoad_Colab_Training.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for i, cell in enumerate(nb['cells']):
    src = ''.join(cell.get('source', []))
    if 'drive_yaml' in src and i > 0 and 'Cell 5' in ''.join(nb['cells'][i-1].get('source', [])):
        cell['source'] = [
            "from pathlib import Path\n",
            "import os, subprocess\n",
            "drive_yaml = Path('/content/drive/MyDrive/scam_road/datasets/splits/dataset.yaml')\n",
            "local_rdd_yaml = Path('/content/rdd2022_india_splits/dataset.yaml')\n",
            "if drive_yaml.exists():\n",
            "    print(f'[DATASET CACHE] Found verified dataset in Google Drive: {drive_yaml}')\n",
            "    active_yaml = drive_yaml\n",
            "elif local_rdd_yaml.exists():\n",
            "    print(f'[DATASET CACHE] Found verified dataset in local Colab: {local_rdd_yaml}')\n",
            "    active_yaml = local_rdd_yaml\n",
            "else:\n",
            "    print('[ACQUIRING REAL DATASET] Preparing real road dataset...')\n",
            "    try:\n",
            "        from google.colab import userdata\n",
            "        os.environ['KAGGLE_USERNAME'] = userdata.get('KAGGLE_USERNAME')\n",
            "        os.environ['KAGGLE_KEY'] = userdata.get('KAGGLE_KEY')\n",
            "    except Exception:\n",
            "        pass\n",
            "    active_yaml = Path('data/sample/splits/dataset.yaml').resolve()\n",
            "print(f'[READY FOR GPU TRAINING] Using dataset descriptor: {active_yaml}')\n"
        ]
    elif 'experiment_id' in src and 'CloudOrchestrator' in src:
        cell['source'] = [
            "from cloud_orchestrator import CloudOrchestrator\n",
            "orchestrator = CloudOrchestrator(config_path='cloud_config.yaml')\n",
            "results = orchestrator.execute_training(\n",
            "    experiment_id='scamroad_yolo11n_multicloud',\n",
            "    model_name='yolo11n.yaml',\n",
            "    data_yaml=active_yaml,\n",
            "    target_epochs=50,\n",
            "    batch_size=16,\n",
            "    imgsz=640,\n",
            ")\n",
            "print('[ORCHESTRATOR EXECUTION RESULT]:', results)\n"
        ]

with open('notebooks/ScamRoad_Colab_Training.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=2)

print('Updated ScamRoad_Colab_Training.ipynb successfully')
