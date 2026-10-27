import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.validation_service import validate_verhoeff, generate_verhoeff
from app.security.security import sign_credential_payload, verify_credential_signature

client = TestClient(app)

def test_verhoeff_algorithm():
    # Valid 12-digit number with correct checksum
    valid_11 = "98421057391"
    valid_12 = generate_verhoeff(valid_11)
    assert len(valid_12) == 12
    assert validate_verhoeff(valid_12) is True

    # Tampered single digit
    tampered_digit = valid_12[:-1] + str((int(valid_12[-1]) + 1) % 10)
    assert validate_verhoeff(tampered_digit) is False

    # Adjacent transposition error (swap 2 digits)
    transposed = valid_12[:2] + valid_12[3] + valid_12[2] + valid_12[4:]
    assert validate_verhoeff(transposed) is False

def test_credential_cryptographic_signature():
    payload = '{"credential_id":"AICTE-VC-001","student_id":"s-123","status":"ACTIVE"}'
    sig = sign_credential_payload(payload)
    assert verify_credential_signature(payload, sig) is True

    # Tampered payload must fail
    tampered_payload = '{"credential_id":"AICTE-VC-001","student_id":"s-123","status":"EXPIRED"}'
    assert verify_credential_signature(tampered_payload, sig) is False

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "UP"
    assert "database" in data

def test_auth_login_and_me():
    res = client.post("/api/v1/auth/login", data={"username": "aicte_admin", "password": "Admin@123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user_info"]["role"] == "AICTE_ADMIN"

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "aicte_admin"

def test_analytics_overview():
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_institutions"] >= 8
    assert data["total_enrolled"] >= 1000
    assert "national_utilization_rate" in data
    assert "quota_breakdown" in data

def test_institutions_list():
    res = client.get("/api/v1/institutions")
    assert res.status_code == 200
    insts = res.json()
    assert len(insts) >= 8
    dtu = next((i for i in insts if i["official_code"] == "DTU-DELHI"), None)
    assert dtu is not None
    assert dtu["name"] == "Delhi Technological University (DTU)"

def test_cross_institution_graph():
    res = client.get("/api/v1/validation/graph")
    assert res.status_code == 200
    graph = res.json()
    assert "nodes" in graph
    assert "links" in graph
    assert graph["collision_count"] >= 1

def test_credential_verification_full_and_zkp():
    # Verify Aarav Sharma (Star Student)
    res = client.post("/api/v1/credentials/verify", json={
        "credential_id": "AICTE-VC-DEMO-001",
        "selective_disclosure_mode": False
    })
    assert res.status_code == 200
    full_data = res.json()
    assert full_data["is_valid"] is True
    assert full_data["status"] == "VALID"
    assert "student_name" in full_data["data_disclosed"]
    assert full_data["data_disclosed"]["student_name"] == "Aarav Sharma"

    # Verify with DPDP Act 2023 Selective Disclosure (ZKP Mode)
    zkp_res = client.post("/api/v1/credentials/verify", json={
        "credential_id": "AICTE-VC-DEMO-001",
        "selective_disclosure_mode": True
    })
    assert zkp_res.status_code == 200
    zkp_data = zkp_res.json()
    assert zkp_data["is_valid"] is True
    # In selective disclosure mode, student_name, aadhaar, caste, address are NOT disclosed
    assert "student_name" not in zkp_data["data_disclosed"]
    assert zkp_data["data_disclosed"]["is_active_enrolment"] is True
    assert zkp_data["data_disclosed"]["institution_approved_by_aicte"] is True
    assert zkp_data["data_disclosed"]["privacy_standard"] == "DPDP_ACT_2023_MINIMUM_DISCLOSURE_PRESERVED"
