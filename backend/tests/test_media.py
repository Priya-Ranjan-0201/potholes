"""Integration tests for media upload and SHA-256 integrity verification."""

from __future__ import annotations

import hashlib
import io
import uuid

from fastapi.testclient import TestClient


def test_media_upload_valid_jpeg(client: TestClient) -> None:
    """Test uploading a valid JPEG frame with matching SHA-256 hash succeeds with HTTP 201."""
    # Synthetic minimal valid JPEG bytes
    jpeg_bytes = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\xff\xd9"
    )
    sha256 = hashlib.sha256(jpeg_bytes).hexdigest()
    media_id = str(uuid.uuid4())

    files = {"file": ("test_frame.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
    data = {"media_id": media_id, "sha256_hash": sha256}

    response = client.post("/api/v1/media/upload", files=files, data=data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["media_id"] == media_id
    assert res_json["sha256"] == sha256
    assert res_json["is_privacy_blurred"] is True
    assert res_json["status"] == "UPLOADED"


def test_media_upload_sha256_mismatch(client: TestClient) -> None:
    """Test that mismatched SHA-256 hash is rejected with HTTP 422."""
    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xd9"
    bogus_sha256 = "0" * 64
    media_id = str(uuid.uuid4())

    files = {"file": ("test_frame.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
    data = {"media_id": media_id, "sha256_hash": bogus_sha256}

    response = client.post("/api/v1/media/upload", files=files, data=data)
    assert response.status_code == 422
    assert "checksum mismatch" in response.json()["detail"].lower()


def test_media_upload_invalid_magic_bytes(client: TestClient) -> None:
    """Test that non-image payload (e.g. text/script) is rejected with HTTP 400."""
    fake_bytes = b"MZ\x90\x00\x03\x00\x00\x00"  # Executable header
    sha256 = hashlib.sha256(fake_bytes).hexdigest()
    media_id = str(uuid.uuid4())

    files = {"file": ("malicious.exe", io.BytesIO(fake_bytes), "image/jpeg")}
    data = {"media_id": media_id, "sha256_hash": sha256}

    response = client.post("/api/v1/media/upload", files=files, data=data)
    assert response.status_code == 400
    assert "unsupported or corrupt image format" in response.json()["detail"].lower()
