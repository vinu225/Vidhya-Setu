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
    DuplicateCase, AnomalyAlert, IssuedCredential, AuditEvent,
    UploadBatch, UploadRowResult, ValidationIssue
)
from app.security.security import (
    get_password_hash, compute_apaar_lookup_hash,
    compute_record_tamper_hash, sign_credential_payload
)
from app.services.validation_service import generate_verhoeff
from app.services.anomaly_service import AnomalyService
from app.services.credential_service import CredentialService

def generate_200_synthetic_institutions():
    """Generates 200 procedurally named synthetic institutions across Indian states & UTs"""
    prefixes = [
        "Apex", "Zenith", "Horizon", "Pinnacle", "Vanguard", "Summit", "Nexus", "Matrix",
        "Sterling", "Quantum", "Paramount", "Radiant", "Beacon", "Pioneer", "Crest", "Imperial",
        "Sovereign", "Meridian", "Solus", "Catalyst", "Vector", "Optima", "Aura", "Spectrum",
        "Astral", "Nova", "Cosmos", "Omega", "Alpha", "Titan", "Vedic", "Pragya", "Vidya",
        "Aryabhata", "Chanakya", "Bhaskara", "Varahamihira", "Dronacharya", "Vashishta",
        "Agastya", "Kautilya", "Gautama", "Patanjali", "Charaka", "Sushruta", "Panini",
        "Kanada", "Kapila", "Gargi", "Maitreyi", "Saraswati", "Brahmaputra", "Godavari",
        "Kaveri", "Narmada", "Yamuna", "Indus", "Ganga", "Mahanadi", "Krishna", "Tapti",
        "Vindhya", "Satpura", "Aravali", "Shivalik", "Nilgiri", "Sahyadri", "Himalayan",
        "Kumaon", "Garhwal", "Konkan", "Malabar", "Coromandel", "Deccan", "Doaba", "Malwa",
        "Bundelkhand", "Rohilkhand", "Awadh", "Bhojpur", "Magadh", "Mithila", "Anga",
        "Kalinga", "Utkal", "Vidarbha", "Marathwada", "Khandesh", "Kalyana", "Tuluva",
        "Rayalaseema", "Kosta", "Kakatiya", "Telangana", "Chola", "Pandya", "Chera", "Pallava"
    ]
    suffixes = [
        "Institute of Technology & Science",
        "College of Engineering & Technology",
        "Institute of Advanced Technology",
        "Technical Academy of Higher Learning",
        "Institute of Engineering & Research",
        "Academy of Technology & Management",
        "Engineering & Science Institute",
        "Technical Campus & Research Center"
    ]
    regions_and_states = [
        ("Maharashtra", ["Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Thane", "Amravati"]),
        ("Tamil Nadu", ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Erode", "Vellore"]),
        ("Karnataka", ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Davanagere", "Kalaburagi"]),
        ("Uttar Pradesh", ["Lucknow", "Kanpur", "Varanasi", "Prayagraj", "Agra", "Meerut", "Noida", "Bareilly"]),
        ("Gujarat", ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar"]),
        ("Telangana", ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Mahbubnagar"]),
        ("Andhra Pradesh", ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Kakinada"]),
        ("Rajasthan", ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Alwar"]),
        ("Madhya Pradesh", ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Rewa"]),
        ("West Bengal", ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Kalyani", "Kharagpur"]),
        ("Kerala", ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad"]),
        ("Punjab", ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"]),
        ("Haryana", ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak"]),
        ("Bihar", ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga"]),
        ("Odisha", ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Balasore"]),
        ("Jharkhand", ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"]),
        ("Assam", ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tezpur"]),
        ("Chhattisgarh", ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Durg"]),
        ("Himachal Pradesh", ["Shimla", "Dharamshala", "Solan", "Mandi", "Hamirpur", "Kullu"]),
        ("Uttarakhand", ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Nainital"]),
        ("Jammu & Kashmir", ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur"]),
        ("Goa", ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"])
    ]
    types = ["GOVERNMENT", "AIDED", "PRIVATE", "PRIVATE", "PRIVATE"]
    
    generated = []
    used_codes = set()
    idx = 1
    
    while len(generated) < 200:
        state, districts = regions_and_states[len(generated) % len(regions_and_states)]
        district = districts[(len(generated) // len(regions_and_states)) % len(districts)]
        prefix = prefixes[len(generated) % len(prefixes)]
        suffix = suffixes[(len(generated) * 3) % len(suffixes)]
        itype = types[len(generated) % len(types)]
        rank = (len(generated) % 180) + 21 if itype != "PRIVATE" else None
        
        name = f"{prefix} {suffix} ({district})"
        code_base = f"{prefix[:4].upper()}-{district[:3].upper()}-{str(idx).zfill(2)}"
        if code_base in used_codes:
            code_base = f"{prefix[:4].upper()}-{district[:3].upper()}-{str(idx+500)}"
        used_codes.add(code_base)
        
        generated.append({
            "code": code_base,
            "name": name,
            "state": state,
            "district": district,
            "type": itype,
            "rank": rank
        })
        idx += 1
        
    return generated

def seed_database():
    print("🌱 Initializing Scaled AICTE Database Seeding (241 Institutions)...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 1. Administrative Users
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

    # 2. 41 Premier + 200 Procedurally Generated Synthetic Institutions (Total 241)
    premier_institutions = [
        # Delhi (4)
        {"code": "DTU-DELHI", "name": "Delhi Technological University (DTU)", "state": "Delhi", "district": "North West Delhi", "type": "GOVERNMENT", "rank": 29},
        {"code": "NSUT-DELHI", "name": "Netaji Subhas University of Technology", "state": "Delhi", "district": "South West Delhi", "type": "GOVERNMENT", "rank": 60},
        {"code": "IIITD-DELHI", "name": "Indraprastha Institute of Information Technology", "state": "Delhi", "district": "South Delhi", "type": "GOVERNMENT", "rank": 75},
        {"code": "IGDTUW-DELHI", "name": "Indira Gandhi Delhi Technical University for Women", "state": "Delhi", "district": "Central Delhi", "type": "GOVERNMENT", "rank": 151},
        
        # Maharashtra (4)
        {"code": "VJTI-MUMBAI", "name": "Veermata Jijabai Technological Institute (VJTI)", "state": "Maharashtra", "district": "Mumbai City", "type": "AIDED", "rank": 71},
        {"code": "COEP-PUNE", "name": "COEP Technological University", "state": "Maharashtra", "district": "Pune", "type": "GOVERNMENT", "rank": 73},
        {"code": "SPIT-MUMBAI", "name": "Sardar Patel Institute of Technology", "state": "Maharashtra", "district": "Mumbai Suburban", "type": "PRIVATE", "rank": 125},
        {"code": "VNIT-NAGPUR", "name": "Visvesvaraya National Institute of Technology", "state": "Maharashtra", "district": "Nagpur", "type": "GOVERNMENT", "rank": 41},

        # Karnataka (4)
        {"code": "RVCE-BLR", "name": "R.V. College of Engineering (RVCE)", "state": "Karnataka", "district": "Bengaluru Urban", "type": "PRIVATE", "rank": 89},
        {"code": "BMSCE-BLR", "name": "B.M.S. College of Engineering", "state": "Karnataka", "district": "Bengaluru Urban", "type": "AIDED", "rank": 102},
        {"code": "MSRIT-BLR", "name": "Ramaiah Institute of Technology", "state": "Karnataka", "district": "Bengaluru Urban", "type": "PRIVATE", "rank": 78},
        {"code": "PESU-BLR", "name": "PES University Electronic City Campus", "state": "Karnataka", "district": "Bengaluru Urban", "type": "PRIVATE", "rank": 105},

        # Tamil Nadu (4)
        {"code": "ANNA-CHENNAI", "name": "Anna University - CEG Campus", "state": "Tamil Nadu", "district": "Chennai", "type": "GOVERNMENT", "rank": 14},
        {"code": "NITT-TRICHY", "name": "National Institute of Technology Tiruchirappalli", "state": "Tamil Nadu", "district": "Tiruchirappalli", "type": "GOVERNMENT", "rank": 9},
        {"code": "PSG-COIMBATORE", "name": "PSG College of Technology", "state": "Tamil Nadu", "district": "Coimbatore", "type": "AIDED", "rank": 63},
        {"code": "SSN-CHENNAI", "name": "SSN College of Engineering", "state": "Tamil Nadu", "district": "Chengalpattu", "type": "PRIVATE", "rank": 45},

        # Uttar Pradesh (4)
        {"code": "KNIT-SULTANPUR", "name": "Kamla Nehru Institute of Technology (KNIT)", "state": "Uttar Pradesh", "district": "Sultanpur", "type": "GOVERNMENT", "rank": 165},
        {"code": "HBTU-KANPUR", "name": "Harcourt Butler Technical University", "state": "Uttar Pradesh", "district": "Kanpur", "type": "GOVERNMENT", "rank": 130},
        {"code": "IET-LUCKNOW", "name": "Institute of Engineering & Technology (IET)", "state": "Uttar Pradesh", "district": "Lucknow", "type": "GOVERNMENT", "rank": 142},
        {"code": "MMMUT-GORAKHPUR", "name": "Madan Mohan Malaviya University of Technology", "state": "Uttar Pradesh", "district": "Gorakhpur", "type": "GOVERNMENT", "rank": 180},

        # Telangana (3)
        {"code": "CBIT-HYD", "name": "Chaitanya Bharathi Institute of Technology", "state": "Telangana", "district": "Hyderabad", "type": "PRIVATE", "rank": 155},
        {"code": "VNR-VJIET-HYD", "name": "VNR Vignana Jyothi Institute of Engineering", "state": "Telangana", "district": "Hyderabad", "type": "PRIVATE", "rank": 113},
        {"code": "JNTU-HYD", "name": "JNTUH University College of Engineering", "state": "Telangana", "district": "Hyderabad", "type": "GOVERNMENT", "rank": 82},

        # Gujarat (3)
        {"code": "LDCE-AHMEDABAD", "name": "L.D. College of Engineering", "state": "Gujarat", "district": "Ahmedabad", "type": "GOVERNMENT", "rank": 135},
        {"code": "NIRMA-AHMEDABAD", "name": "Institute of Technology, Nirma University", "state": "Gujarat", "district": "Ahmedabad", "type": "PRIVATE", "rank": 85},
        {"code": "SVNIT-SURAT", "name": "Sardar Vallabhbhai National Institute of Tech", "state": "Gujarat", "district": "Surat", "type": "GOVERNMENT", "rank": 65},

        # West Bengal (3)
        {"code": "JU-KOLKATA", "name": "Jadavpur University Faculty of Engg", "state": "West Bengal", "district": "Kolkata", "type": "GOVERNMENT", "rank": 10},
        {"code": "IIEST-SHIBPUR", "name": "Indian Institute of Engineering Science & Tech", "state": "West Bengal", "district": "Howrah", "type": "GOVERNMENT", "rank": 35},
        {"code": "HIT-KOLKATA", "name": "Heritage Institute of Technology", "state": "West Bengal", "district": "Kolkata", "type": "PRIVATE", "rank": 170},

        # Kerala (3)
        {"code": "CET-TRIVANDRUM", "name": "College of Engineering Trivandrum", "state": "Kerala", "district": "Thiruvananthapuram", "type": "GOVERNMENT", "rank": 85},
        {"code": "GEC-THRISSUR", "name": "Government Engineering College Thrissur", "state": "Kerala", "district": "Thrissur", "type": "GOVERNMENT", "rank": 140},
        {"code": "MEC-KOCHI", "name": "Govt Model Engineering College", "state": "Kerala", "district": "Ernakulam", "type": "GOVERNMENT", "rank": 160},

        # Punjab (3)
        {"code": "THAPAR-PATIALA", "name": "Thapar Institute of Engineering and Technology", "state": "Punjab", "district": "Patiala", "type": "PRIVATE", "rank": 20},
        {"code": "PEC-CHANDIGARH", "name": "PEC University of Technology", "state": "Punjab", "district": "Chandigarh", "type": "GOVERNMENT", "rank": 87},
        {"code": "GNDEC-LUDHIANA", "name": "Guru Nanak Dev Engineering College", "state": "Punjab", "district": "Ludhiana", "type": "AIDED", "rank": 185},

        # Rajasthan (2) - Planted Over-Intake Anomaly 1
        {"code": "RTU-KOTA", "name": "Rajasthan Technical University", "state": "Rajasthan", "district": "Kota", "type": "GOVERNMENT", "rank": 175},
        {"code": "LNMIIT-JAIPUR", "name": "The LNM Institute of Information Technology", "state": "Rajasthan", "district": "Jaipur", "type": "PRIVATE", "rank": 110},

        # Madhya Pradesh (2) - Planted Over-Intake Anomaly 2
        {"code": "MITS-GWALIOR", "name": "Madhav Institute of Technology and Science", "state": "Madhya Pradesh", "district": "Gwalior", "type": "AIDED", "rank": 178},
        {"code": "SGSITS-INDORE", "name": "Shri Govindram Seksaria Institute of Tech", "state": "Madhya Pradesh", "district": "Indore", "type": "AIDED", "rank": 145},

        # Andhra Pradesh & Odisha (2)
        {"code": "AU-VISHAKHAPATNAM", "name": "Andhra University College of Engineering", "state": "Andhra Pradesh", "district": "Visakhapatnam", "type": "GOVERNMENT", "rank": 95},
        {"code": "VSSUT-BURLA", "name": "Veer Surendra Sai University of Technology", "state": "Odisha", "district": "Sambalpur", "type": "GOVERNMENT", "rank": 115}
    ]

    generated_institutions = generate_200_synthetic_institutions()
    all_institutions_seed = premier_institutions + generated_institutions

    program_templates = [
        {"name": "Computer Science & Engineering", "code_suffix": "CSE", "intake": 120, "tfw": 6, "ews": 12, "nri": 6, "fn": 18},
        {"name": "Electronics & Communication Engg", "code_suffix": "ECE", "intake": 120, "tfw": 6, "ews": 12, "nri": 6, "fn": 18},
        {"name": "Mechanical Engineering", "code_suffix": "MECH", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9},
        {"name": "Artificial Intelligence & Data Science", "code_suffix": "AIDS", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9},
        {"name": "Civil Engineering", "code_suffix": "CIVIL", "intake": 60, "tfw": 3, "ews": 6, "nri": 3, "fn": 9}
    ]

    inst_map = {}
    all_programs = []

    print(f"🏛️ Creating {len(all_institutions_seed)} institutions in database...")
    for idata in all_institutions_seed:
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

        code_slug = idata["code"].lower().replace("-", "_")
        inst_admin = User(
            username=f"admin_{code_slug}",
            email=f"registrar_{code_slug}@aicte-network.edu.in",
            hashed_password=get_password_hash("College@123"),
            role="INSTITUTION_ADMIN",
            institution_id=inst.id
        )
        db.add(inst_admin)

        if idata["code"] == "DTU-DELHI":
            db.add(User(
                username="dtu_admin",
                email="registrar@dtu.edu.in",
                hashed_password=get_password_hash("College@123"),
                role="INSTITUTION_ADMIN",
                institution_id=inst.id
            ))
        elif idata["code"] == "KNIT-SULTANPUR":
            db.add(User(
                username="knit_deo",
                email="admissions@knit.edu.in",
                hashed_password=get_password_hash("College@123"),
                role="DATA_ENTRY_OFFICER",
                institution_id=inst.id
            ))

        # Assign 3-4 programs per institution
        progs_for_inst = program_templates[:random.choice([3, 4, 5])]
        for pdata in progs_for_inst:
            prog_code = f"{pdata['code_suffix']}-{idata['code'].replace('-', '_').upper()}"
            prog = Program(
                institution_id=inst.id,
                program_name=pdata["name"],
                program_code=prog_code,
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
            all_programs.append(prog)

    db.commit()
    print(f"✅ Seeded {len(inst_map)} institutions across 22+ states with {len(all_programs)} programs.")

    # 3. Deterministic Seed Scenarios & 5 Cross-Institution Collisions
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

    # Star Student (DTU)
    valid_apaar = "984210573915"
    dtu_inst = inst_map["DTU-DELHI"]
    dtu_cse = next(p for p in all_programs if p.institution_id == dtu_inst.id and "CSE" in p.program_code)

    star_student = Student(
        apaar_id=valid_apaar,
        apaar_lookup_hash=compute_apaar_lookup_hash(valid_apaar),
        student_id="24/DTU/001",
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
        tamper_hash=compute_record_tamper_hash(star_student.id, dtu_inst.id, dtu_cse.id, "24/DTU/001")
    )
    db.add(star_enr)
    db.flush()

    star_cred = CredentialService.issue_credential(db, star_student.id, star_enr.id)
    star_cred.credential_id = "AICTE-VC-DEMO-001"
    db.commit()

    # 5 Cross-Institution Collision Scenarios
    collision_fixtures = [
        {"apaar": "883920194835", "name": "Sameer Verma", "inst1": "DTU-DELHI", "inst2": "KNIT-SULTANPUR", "roll1": "24/DTU/901", "roll2": "24/KNIT/302"},
        {"apaar": "918237465017", "name": "Rohan Iyer", "inst1": "VJTI-MUMBAI", "inst2": "COEP-PUNE", "roll1": "24/VJTI/554", "roll2": "24/COEP/112"},
        {"apaar": "749201837462", "name": "Ananya Sen", "inst1": "JU-KOLKATA", "inst2": "IIEST-SHIBPUR", "roll1": "24/JU/209", "roll2": "24/IIEST/811"},
        {"apaar": "638192048573", "name": "Karthik Reddy", "inst1": "RVCE-BLR", "inst2": "CBIT-HYD", "roll1": "24/RV/401", "roll2": "24/CBIT/092"},
        {"apaar": "529384710294", "name": "Divya Pillai", "inst1": "ANNA-CHENNAI", "inst2": "NITT-TRICHY", "roll1": "24/ANNA/771", "roll2": "24/NITT/105"}
    ]

    for fix in collision_fixtures:
        stu = Student(
            apaar_id=fix["apaar"],
            apaar_lookup_hash=compute_apaar_lookup_hash(fix["apaar"]),
            student_id=fix["roll1"],
            name=fix["name"],
            dob="2004-03-12",
            gender="Other",
            category="OBC"
        )
        db.add(stu)
        db.flush()

        inst1 = inst_map[fix["inst1"]]
        inst2 = inst_map[fix["inst2"]]
        prog1 = next(p for p in all_programs if p.institution_id == inst1.id)
        prog2 = next(p for p in all_programs if p.institution_id == inst2.id)

        enr1 = Enrolment(
            student_id=stu.id,
            institution_id=inst1.id,
            program_id=prog1.id,
            academic_year="2024-25",
            admission_date="2024-07-25",
            seat_category="REGULAR",
            supernumerary_classification="NONE",
            tamper_hash=compute_record_tamper_hash(stu.id, inst1.id, prog1.id, fix["roll1"])
        )
        enr2 = Enrolment(
            student_id=stu.id,
            institution_id=inst2.id,
            program_id=prog2.id,
            academic_year="2024-25",
            admission_date="2024-08-05",
            seat_category="REGULAR",
            supernumerary_classification="NONE",
            tamper_hash=compute_record_tamper_hash(stu.id, inst2.id, prog2.id, fix["roll2"])
        )
        db.add_all([enr1, enr2])

        c_id = f"CASE-{fix['apaar'][-4:]}-{fix['inst1'][:4]}"
        dup_case = DuplicateCase(
            case_id=c_id,
            pseudonymous_id=f"{fix['apaar'][:4]} •••• {fix['apaar'][-4:]}",
            student_name=fix["name"],
            primary_institution_id=inst1.id,
            secondary_institution_id=inst2.id,
            academic_year="2024-25",
            detection_reason="MULTI_INSTITUTION_ACTIVE_ENROLMENT",
            evidence_summary=f"Concurrent full-time enrolment detected between {inst1.name} and {inst2.name}.",
            severity="CRITICAL",
            review_status="PENDING"
        )
        db.add(dup_case)

    # 4. Generate ~3,500 Student Admissions across all 241 institutions
    random.seed(42)
    student_count = 3500
    print(f"🔄 Seeding {student_count} student admissions across {len(inst_map)} institutions...")

    for idx in range(1, student_count + 1):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        full_name = f"{fn} {ln}"
        cat = random.choice(["General", "OBC", "SC", "ST", "EWS"])
        gender = random.choice(["Male", "Female"])

        rand_11 = str(random.randint(10000000000, 99999999999))
        apaar_12 = generate_verhoeff(rand_11)

        prog = random.choice(all_programs)
        inst_id = prog.institution_id
        roll = f"24/{prog.program_code[:4]}/{str(idx).zfill(4)}"

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
        elif rand_val < 0.21:
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
            admission_date=f"2024-08-{str(random.randint(1,28)).zfill(2)}",
            enrolment_status="ACTIVE",
            seat_category=seat_cat,
            is_nri=(super_class == "NRI"),
            is_fn=(super_class == "FN_OCI"),
            supernumerary_classification=super_class,
            tamper_hash=tamper,
            submission_source="SYNTHETIC_INGESTION_BENCHMARK"
        )
        db.add(enr)

    # 5. Planted Over-Intake Anomalies (RTU-Kota, MITS-Gwalior, + 1 generated college)
    rtu_inst = inst_map["RTU-KOTA"]
    rtu_prog = next(p for p in all_programs if p.institution_id == rtu_inst.id)
    print("🚨 Planting Over-Intake Anomaly 1: RTU-KOTA...")
    for ex in range(1, 60):
        rand_11 = str(random.randint(10000000000, 99999999999))
        apaar_12 = generate_verhoeff(rand_11)
        stu = Student(
            apaar_id=apaar_12,
            apaar_lookup_hash=compute_apaar_lookup_hash(apaar_12),
            student_id=f"24/RTU/EXCESS-{ex}",
            name=f"Extra Student {ex}",
            dob="2004-06-15",
            gender="Male",
            category="General"
        )
        db.add(stu)
        db.flush()
        db.add(Enrolment(
            student_id=stu.id,
            institution_id=rtu_inst.id,
            program_id=rtu_prog.id,
            academic_year="2024-25",
            admission_date="2024-09-02",
            enrolment_status="ACTIVE",
            seat_category="REGULAR",
            supernumerary_classification="NONE",
            tamper_hash=compute_record_tamper_hash(stu.id, rtu_inst.id, rtu_prog.id, stu.student_id),
            submission_source="UNSANCTIONED_OVER_INTAKE_BATCH"
        ))

    mits_inst = inst_map["MITS-GWALIOR"]
    mits_prog = next(p for p in all_programs if p.institution_id == mits_inst.id)
    print("🚨 Planting Over-Intake Anomaly 2: MITS-GWALIOR...")
    for ex in range(1, 50):
        rand_11 = str(random.randint(10000000000, 99999999999))
        apaar_12 = generate_verhoeff(rand_11)
        stu = Student(
            apaar_id=apaar_12,
            apaar_lookup_hash=compute_apaar_lookup_hash(apaar_12),
            student_id=f"24/MITS/EXCESS-{ex}",
            name=f"Over admitted {ex}",
            dob="2004-07-20",
            gender="Female",
            category="General"
        )
        db.add(stu)
        db.flush()
        db.add(Enrolment(
            student_id=stu.id,
            institution_id=mits_inst.id,
            program_id=mits_prog.id,
            academic_year="2024-25",
            admission_date="2024-09-03",
            enrolment_status="ACTIVE",
            seat_category="REGULAR",
            supernumerary_classification="NONE",
            tamper_hash=compute_record_tamper_hash(stu.id, mits_inst.id, mits_prog.id, stu.student_id),
            submission_source="UNSANCTIONED_OVER_INTAKE_BATCH"
        ))

    # 6. Seed ~45 Provisional Enrolments (No APAAR yet - Grace period workflow)
    print("⏳ Seeding 45 Provisional (Grace-period) Admissions...")
    for p_idx in range(1, 46):
        rand_inst = random.choice(list(inst_map.values()))
        rand_prog = next(p for p in all_programs if p.institution_id == rand_inst.id)
        temp_id = f"TEMP-{rand_inst.official_code[:4]}-2024-{str(p_idx).zfill(4)}"
        stu = Student(
            apaar_id=temp_id,
            apaar_lookup_hash=compute_apaar_lookup_hash(temp_id),
            student_id=f"24/PROV/{str(p_idx).zfill(3)}",
            name=f"{random.choice(first_names)} {random.choice(last_names)}",
            dob="2004-09-10",
            gender="Other",
            category="General"
        )
        db.add(stu)
        db.flush()
        db.add(Enrolment(
            student_id=stu.id,
            institution_id=rand_inst.id,
            program_id=rand_prog.id,
            academic_year="2024-25",
            admission_date="2024-08-28",
            enrolment_status="PROVISIONAL",
            seat_category="REGULAR",
            supernumerary_classification="NONE",
            tamper_hash=compute_record_tamper_hash(stu.id, rand_inst.id, rand_prog.id, stu.student_id),
            submission_source="PROVISIONAL_GRACE_PERIOD"
        ))

    # 7. Planted Anomaly: 3 Suspicious Bulk Uploads with Validation Issues
    print("📁 Seeding 3 Suspicious Bulk Upload Batches...")
    b1 = UploadBatch(
        institution_id=rtu_inst.id,
        file_name="rtu_late_night_admissions_bulk_dump.xlsx",
        file_size=428900,
        total_rows=120,
        processed_rows=120,
        successful_rows=78,
        failed_rows=42,
        status="COMPLETED",
        created_at=datetime.now(timezone.utc) - timedelta(hours=6)
    )
    db.add(b1)
    db.flush()
    db.add(ValidationIssue(
        batch_id=b1.id,
        institution_id=rtu_inst.id,
        rule_code="SUPERNUMERARY_QUOTA_BREACH_TFW",
        severity="HIGH",
        explanation="TFW quota breached by 14 seats in Computer Science program.",
        supporting_evidence="Batch uploaded at 02:45 AM containing 20 TFW claims exceeding 5% cap.",
        recommended_action="Freeze TFW seat allotment and issue show cause notice."
    ))

    b2 = UploadBatch(
        institution_id=mits_inst.id,
        file_name="mits_emergency_admissions_backfill.csv",
        file_size=214000,
        total_rows=65,
        processed_rows=65,
        successful_rows=30,
        failed_rows=35,
        status="FAILED",
        created_at=datetime.now(timezone.utc) - timedelta(hours=14)
    )
    db.add(b2)
    db.flush()
    db.add(ValidationIssue(
        batch_id=b2.id,
        institution_id=mits_inst.id,
        rule_code="IDENTIFIER_CHECKSUM_FAILED",
        severity="CRITICAL",
        explanation="35 records failed Verhoeff Dihedral Group mathematical parity checks.",
        supporting_evidence="Randomly generated dummy 12-digit strings detected in file.",
        recommended_action="Reject batch and mandate candidate re-fetch from Academic Bank of Credits."
    ))

    knit_inst = inst_map["KNIT-SULTANPUR"]
    b3 = UploadBatch(
        institution_id=knit_inst.id,
        file_name="knit_direct_counseling_quota.csv",
        file_size=180000,
        total_rows=50,
        processed_rows=50,
        successful_rows=41,
        failed_rows=9,
        status="COMPLETED",
        created_at=datetime.now(timezone.utc) - timedelta(days=1)
    )
    db.add(b3)
    db.flush()
    db.add(ValidationIssue(
        batch_id=b3.id,
        institution_id=knit_inst.id,
        rule_code="CROSS_INSTITUTION_COLLISION",
        severity="CRITICAL",
        explanation="9 candidates already hold confirmed active seats in Delhi and Maharashtra colleges.",
        supporting_evidence="Dual admission collision in AY 2024-25 detected via global HMAC lookup.",
        recommended_action="Summon candidate and nodal officer for identity verification."
    ))

    db.commit()

    # 8. Run Anomaly and Integrity Engine
    print("🔍 Executing AICTE Anomaly Engine across 241 institutions...")
    AnomalyService.run_explainable_anomaly_detection(db)

    # 9. Record System Audit Events
    AuditEvent(
        actor_username="SYSTEM_SEEDER",
        actor_role="AICTE_ADMIN",
        action="LARGE_SCALE_BENCHMARK_SEED_COMPLETED",
        description=f"Successfully initialized {len(all_institutions_seed)} institutions across 22+ states with 3,600+ verified records.",
        institution_id=dtu_inst.id
    )
    db.commit()

    db.close()
    print(f"✨ Large Scale Seeding Complete! {len(all_institutions_seed)} institutions, 3,600+ records ready.")

if __name__ == "__main__":
    seed_database()
