import sys
import os
import random
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.database import SessionLocal, Base, engine
from app.models.models import (
    Institution, Program, Student, Enrolment, User,
    DuplicateCase, AnomalyAlert, IssuedCredential, AuditEvent
)
from app.security.security import (
    get_password_hash, compute_apaar_lookup_hash,
    compute_record_tamper_hash, sign_credential_payload
)
from app.services.validation_service import generate_verhoeff
from app.services.anomaly_service import AnomalyService

def seed_database():
    print("🌱 Initializing EduVerify AI Database Seeding...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 1. Seed Core Administrative Users
    admin_user = User(
        username="aicte_admin",
        email="admin@aicte-india.org",
        hashed_password=get_password_hash("Admin@123"),
        role="AICTE_ADMIN"
    )
    auditor_user = User(
        username="auditor",
        email="auditor@aicte-india.org",
        hashed_password=get_password_hash("Auditor@123"),
        role="AUDITOR"
    )
    verifier_user = User(
        username="verifier",
        email="verifier@tcs-recruitment.com",
        hashed_password=get_password_hash("Verifier@123"),
        role="EXTERNAL_VERIFIER"
    )
    db.add_all([admin_user, auditor_user, verifier_user])
    db.flush()

    # 2. Seed 8 Premier AICTE Institutions
    institutions_data = [
        {
            "code": "DTU-DELHI",
            "name": "Delhi Technological University (DTU)",
            "state": "Delhi",
            "district": "North West Delhi",
            "type": "GOVERNMENT",
            "rank": 29,
            "programs": [
                {"name": "Computer Science & Engineering", "code": "CSE-BTECH", "intake": 180, "tfw": 9, "ews": 18, "nri": 9, "fn": 27},
                {"name": "Electronics & Communication Engg", "code": "ECE-BTECH", "intake": 120, "tfw": 6, "ews": 12, "nri": 6, "fn": 18},
                {"name": "Artificial Intelligence & Data Science", "code": "AI-DS-BTECH", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9}
            ]
        },
        {
            "code": "VJTI-MUMBAI",
            "name": "Veermata Jijabai Technological Institute (VJTI)",
            "state": "Maharashtra",
            "district": "Mumbai City",
            "type": "AIDED",
            "rank": 71,
            "programs": [
                {"name": "Information Technology", "code": "IT-BTECH", "intake": 120, "tfw": 6, "ews": 12, "nri": 6, "fn": 18},
                {"name": "Computer Engineering", "code": "CE-BTECH", "intake": 120, "tfw": 6, "ews": 12, "nri": 6, "fn": 18}
            ]
        },
        {
            "code": "RVCE-BLR",
            "name": "R.V. College of Engineering (RVCE)",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "type": "PRIVATE",
            "rank": 89,
            "programs": [
                {"name": "Computer Science & Engineering", "code": "CSE-RV", "intake": 180, "tfw": 9, "ews": 18, "nri": 9, "fn": 27},
                {"name": "Aerospace Engineering", "code": "AERO-RV", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9}
            ]
        },
        {
            "code": "ANNA-CHENNAI",
            "name": "Anna University - CEG Campus",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "type": "GOVERNMENT",
            "rank": 14,
            "programs": [
                {"name": "Mechanical Engineering", "code": "MECH-CEG", "intake": 120, "tfw": 6, "ews": 12, "nri": 6, "fn": 18},
                {"name": "Electrical & Electronics Engineering", "code": "EEE-CEG", "intake": 120, "tfw": 6, "ews": 12, "nri": 6, "fn": 18}
            ]
        },
        {
            "code": "KNIT-SULTANPUR",
            "name": "Kamla Nehru Institute of Technology (KNIT)",
            "state": "Uttar Pradesh",
            "district": "Sultanpur",
            "type": "GOVERNMENT",
            "rank": 165,
            "programs": [
                {"name": "Computer Science & Engineering", "code": "CSE-KNIT", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9},
                {"name": "Civil Engineering", "code": "CIVIL-KNIT", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9}
            ]
        },
        {
            "code": "COEP-PUNE",
            "name": "COEP Technological University",
            "state": "Maharashtra",
            "district": "Pune",
            "type": "GOVERNMENT",
            "rank": 73,
            "programs": [
                {"name": "Instrumentation & Control", "code": "INST-COEP", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9},
                {"name": "Computer Engineering", "code": "COMP-COEP", "intake": 120, "tfw": 6, "ews": 12, "nri": 6, "fn": 18}
            ]
        },
        {
            "code": "JU-KOLKATA",
            "name": "Jadavpur University Faculty of Engg",
            "state": "West Bengal",
            "district": "Kolkata",
            "type": "GOVERNMENT",
            "rank": 10,
            "programs": [
                {"name": "Power Engineering", "code": "POWER-JU", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9},
                {"name": "Computer Science & Engineering", "code": "CSE-JU", "intake": 90, "tfw": 4, "ews": 9, "nri": 4, "fn": 13}
            ]
        },
        {
            "code": "NITT-TRICHY",
            "name": "National Institute of Technology Tiruchirappalli",
            "state": "Tamil Nadu",
            "district": "Tiruchirappalli",
            "type": "GOVERNMENT",
            "rank": 9,
            "programs": [
                {"name": "Chemical Engineering", "code": "CHEM-NITT", "intake": 80, "tfw": 4, "ews": 8, "nri": 4, "fn": 12},
                {"name": "Production Engineering", "code": "PROD-NITT", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9}
            ]
        }
    ]

    inst_map = {}
    prog_map = {}

    for idata in institutions_data:
        inst = Institution(
            official_code=idata["code"],
            name=idata["name"],
            state=idata["state"],
            district=idata["district"],
            institution_type=idata["type"],
            nirf_rank=idata["rank"],
            approval_status="APPROVED"
        )
        db.add(inst)
        db.flush()
        inst_map[idata["code"]] = inst

        # Create Institution Admin & DEO users for this college
        prefix = idata["code"].split("-")[0].lower()
        inst_admin = User(
            username=f"{prefix}_admin",
            email=f"registrar@{prefix}.edu.in",
            hashed_password=get_password_hash("College@123"),
            role="INSTITUTION_ADMIN",
            institution_id=inst.id
        )
        inst_deo = User(
            username=f"{prefix}_deo",
            email=f"admissions@{prefix}.edu.in",
            hashed_password=get_password_hash("College@123"),
            role="DATA_ENTRY_OFFICER",
            institution_id=inst.id
        )
        db.add_all([inst_admin, inst_deo])

        for pdata in idata["programs"]:
            prog = Program(
                institution_id=inst.id,
                program_name=pdata["name"],
                program_code=pdata["code"],
                approved_regular_intake=pdata["intake"],
                tfw_quota=pdata["tfw"],
                ews_quota=pdata["ews"],
                nri_quota=pdata["nri"],
                fn_oci_quota=pdata["fn"],
                pmsss_quota=2,
                academic_year="2024-25"
            )
            db.add(prog)
            db.flush()
            prog_map[f"{idata['code']}_{pdata['code']}"] = prog

    print(f"✅ Seeded {len(inst_map)} institutions and {len(prog_map)} programs.")

    # 3. Deterministic Seed Test Scenarios
    # Scenario A: Valid Star Student (DTU)
    valid_apaar = "984210573915"  # Valid Verhoeff
    dtu_inst = inst_map["DTU-DELHI"]
    dtu_cse = prog_map["DTU-DELHI_CSE-BTECH"]

    star_student = Student(
        apaar_id=valid_apaar,
        apaar_lookup_hash=compute_apaar_lookup_hash(valid_apaar),
        student_id="24/CSE/001",
        name="Aarav Sharma",
        dob="2004-05-14",
        gender="Male",
        category="General"
    )
    db.add(star_student)
    db.flush()

    star_enr = Enrolment(
        student_id=star_student.id,
        institution_id=dtu_inst.id,
        program_id=dtu_cse.id,
        academic_year="2024-25",
        admission_date="2024-08-01",
        seat_category="REGULAR",
        supernumerary_classification="NONE",
        tamper_hash=compute_record_tamper_hash(star_student.id, dtu_inst.id, dtu_cse.id, "24/CSE/001")
    )
    db.add(star_enr)
    db.flush()

    # Issue verifiable credential for Aarav Sharma using CredentialService
    from app.services.credential_service import CredentialService
    star_cred = CredentialService.issue_credential(db, star_student.id, star_enr.id)
    star_cred.credential_id = "AICTE-VC-DEMO-001"
    # Re-sign with updated ID
    cred_claims = {
        "credential_id": star_cred.credential_id,
        "student_id": star_student.id,
        "roll_no": star_student.student_id,
        "institution_code": dtu_inst.official_code,
        "program_code": dtu_cse.program_code,
        "academic_period": star_cred.academic_period,
        "issued_at": star_cred.issued_at.isoformat(),
        "expires_at": star_cred.expires_at.isoformat() if star_cred.expires_at else ""
    }
    import json
    star_cred.digital_signature = sign_credential_payload(json.dumps(cred_claims, sort_keys=True))
    db.commit()

    # Scenario B: Ghost / Cross-Institution Collision Student (DTU & KNIT Sultanpur)
    collision_apaar = "883920194835"  # Valid Verhoeff
    knit_inst = inst_map["KNIT-SULTANPUR"]
    knit_cse = prog_map["KNIT-SULTANPUR_CSE-KNIT"]

    collision_student = Student(
        apaar_id=collision_apaar,
        apaar_lookup_hash=compute_apaar_lookup_hash(collision_apaar),
        student_id="24/DTU/999",
        name="Sameer Verma",
        dob="2003-11-20",
        gender="Male",
        category="OBC"
    )
    db.add(collision_student)
    db.flush()

    # Enrolled in DTU
    enr_dtu = Enrolment(
        student_id=collision_student.id,
        institution_id=dtu_inst.id,
        program_id=dtu_cse.id,
        academic_year="2024-25",
        admission_date="2024-07-28",
        seat_category="REGULAR",
        supernumerary_classification="NONE",
        tamper_hash=compute_record_tamper_hash(collision_student.id, dtu_inst.id, dtu_cse.id, "24/DTU/999")
    )
    # Enrolled concurrently in KNIT
    enr_knit = Enrolment(
        student_id=collision_student.id,
        institution_id=knit_inst.id,
        program_id=knit_cse.id,
        academic_year="2024-25",
        admission_date="2024-08-04",
        seat_category="REGULAR",
        supernumerary_classification="NONE",
        tamper_hash=compute_record_tamper_hash(collision_student.id, knit_inst.id, knit_cse.id, "24/KNIT/302")
    )
    db.add_all([enr_dtu, enr_knit])

    dup_case = DuplicateCase(
        case_id="CASE-4835-DTU-KNIT",
        pseudonymous_id="8839 •••• 4835",
        student_name="Sameer Verma",
        primary_institution_id=dtu_inst.id,
        secondary_institution_id=knit_inst.id,
        academic_year="2024-25",
        detection_reason="MULTI_INSTITUTION_ACTIVE_ENROLMENT",
        evidence_summary="Candidate concurrently admitted in DTU Delhi (B.Tech CSE) and KNIT Sultanpur (B.Tech CSE) in AY 2024-25.",
        severity="CRITICAL",
        review_status="PENDING"
    )
    db.add(dup_case)

    # 4. Generate 1,000+ Synthetic Student Admissions across all institutions
    first_names = [
        "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
        "Shaurya", "Atharva", "Ananya", "Diya", "Isha", "Riya", "Pooja", "Neha", "Tanvi", "Saanvi",
        "Kavya", "Sneha", "Priya", "Aditi", "Meera", "Anika", "Rohan", "Vikram", "Rahul", "Karan",
        "Gaurav", "Naveen", "Deepak", "Manish", "Rajesh", "Sunil", "Amit", "Suresh", "Varun", "Abhishek"
    ]
    last_names = [
        "Sharma", "Verma", "Gupta", "Mehta", "Patel", "Reddy", "Nair", "Iyer", "Choudhury", "Singh",
        "Yadav", "Mishra", "Joshi", "Bose", "Chatterjee", "Kulkarni", "Deshmukh", "Pillai", "Menon", "Rao"
    ]
    categories = ["General", "OBC", "SC", "ST", "EWS"]
    genders = ["Male", "Female"]

    # Pre-generate valid Verhoeff APAARs
    random.seed(42)
    total_to_generate = 1050
    print(f"🔄 Generating {total_to_generate} synthetic student records...")

    all_progs = list(prog_map.values())

    for idx in range(1, total_to_generate + 1):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        full_name = f"{fn} {ln}"
        cat = random.choice(categories)
        gender = random.choice(genders)

        # Generate 11 random digits and append 12th Verhoeff checksum
        rand_11 = str(random.randint(10000000000, 99999999999))
        apaar_12 = generate_verhoeff(rand_11)

        prog = random.choice(all_progs)
        inst_id = prog.institution_id

        # Determine seat category & supernumerary
        roll = f"24/{prog.program_code[:3]}/{str(idx).zfill(4)}"
        rand_val = random.random()
        if rand_val < 0.05:
            seat_cat = "TFW"
            super_class = "TFW"
        elif rand_val < 0.12:
            seat_cat = "EWS"
            super_class = "EWS"
        elif rand_val < 0.16:
            seat_cat = "NRI"
            super_class = "NRI"
        elif rand_val < 0.19:
            seat_cat = "FN_OCI"
            super_class = "FN_OCI"
        elif rand_val < 0.20:
            seat_cat = "PMSSS"
            super_class = "PMSSS"
        else:
            seat_cat = "REGULAR"
            super_class = "NONE"

        stu = Student(
            apaar_id=apaar_12,
            apaar_lookup_hash=compute_apaar_lookup_hash(apaar_12),
            student_id=roll,
            name=full_name,
            dob=f"{random.randint(2003, 2005)}-{str(random.randint(1,12)).zfill(2)}-{str(random.randint(1,28)).zfill(2)}",
            gender=gender,
            category=cat
        )
        db.add(stu)
        db.flush()

        tamper = compute_record_tamper_hash(stu.id, inst_id, prog.id, roll)
        enr = Enrolment(
            student_id=stu.id,
            institution_id=inst_id,
            program_id=prog.id,
            academic_year="2024-25",
            admission_date=f"2024-08-{str(random.randint(1,25)).zfill(2)}",
            enrolment_status="ACTIVE",
            seat_category=seat_cat,
            is_nri=(super_class == "NRI"),
            is_fn=(super_class == "FN_OCI"),
            supernumerary_classification=super_class,
            tamper_hash=tamper,
            submission_source="SYNTHETIC_INGESTION_BENCHMARK"
        )
        db.add(enr)

    db.commit()

    # 5. Run Anomaly and Integrity Engine to populate regulatory alerts
    print("🔍 Executing Anomaly Detection Engine on Seeded State...")
    AnomalyService.run_explainable_anomaly_detection(db)

    # 6. Record Audit Event
    AuditEvent(
        actor_username="SYSTEM_SEEDER",
        actor_role="AICTE_ADMIN",
        action="BENCHMARK_SEED_COMPLETED",
        description=f"Successfully seeded {len(institutions_data)} institutions and {total_to_generate + 2} verified student enrolments.",
        institution_id=dtu_inst.id
    )

    db.close()
    print("✨ Seeding completed successfully! 1,050+ records ready for evaluation.")

if __name__ == "__main__":
    seed_database()
