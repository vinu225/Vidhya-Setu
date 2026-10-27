import re
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.models import Student, Enrolment, Program, Institution, ValidationIssue, DuplicateCase
from app.security.security import compute_apaar_lookup_hash, mask_apaar_id

# ==========================================
# VERHOEFF CHECKSUM ALGORITHM (Aadhaar / APAAR standard)
# ==========================================
d_table = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

p_table = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

inv_table = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

def validate_verhoeff(num_str: str) -> bool:
    clean = re.sub(r'\s+', '', str(num_str))
    if not re.match(r'^\d{12}$', clean):
        return False
    c = 0
    inverted_array = [int(x) for x in reversed(clean)]
    for i, num in enumerate(inverted_array):
        c = d_table[c][p_table[i % 8][num]]
    return c == 0

def generate_verhoeff(num_11: str) -> str:
    clean = re.sub(r'\s+', '', str(num_11))
    c = 0
    inverted_array = [int(x) for x in reversed(clean)]
    for i, num in enumerate(inverted_array):
        c = d_table[c][p_table[(i + 1) % 8][num]]
    return clean + str(inv_table[c])

class ValidationService:
    @staticmethod
    def validate_student_record(
        db: Session,
        row_data: Dict[str, Any],
        institution_id: str,
        batch_id: str = None
    ) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Validates an incoming student admission record against regulatory constraints.
        Returns: (is_valid, list_of_issues)
        """
        issues = []
        apaar = str(row_data.get("apaar_id", "")).strip().replace(" ", "")
        roll_no = str(row_data.get("student_id", "") or row_data.get("roll_no", "")).strip()
        program_code = str(row_data.get("program_code", "") or row_data.get("program_id", "")).strip()
        name = str(row_data.get("name", "")).strip()
        seat_category = str(row_data.get("seat_category", "REGULAR")).strip().upper()
        supernumerary = str(row_data.get("supernumerary_classification", "NONE")).strip().upper()
        academic_year = str(row_data.get("academic_year", "2024-25")).strip()

        # 1. Identifier Validation
        if not apaar:
            issues.append({
                "rule_code": "IDENTIFIER_MISSING",
                "severity": "CRITICAL",
                "explanation": "APAAR identifier is missing. Admission cannot be validated without a national academic ID.",
                "action": "Obtain verified 12-digit APAAR ID from candidate DigiLocker/ABC portal."
            })
        elif not validate_verhoeff(apaar):
            issues.append({
                "rule_code": "IDENTIFIER_CHECKSUM_FAILED",
                "severity": "CRITICAL",
                "explanation": f"Identifier {mask_apaar_id(apaar)} failed national Verhoeff checksum parity validation.",
                "action": "Rectify typo or mandate candidate re-fetch from Academic Bank of Credits."
            })

        # 2. Program Existence Validation
        program = db.query(Program).filter(
            Program.institution_id == institution_id,
            (Program.program_code == program_code) | (Program.id == program_code)
        ).first()

        if not program:
            issues.append({
                "rule_code": "INVALID_PROGRAM_REFERENCE",
                "severity": "HIGH",
                "explanation": f"Program '{program_code}' is not an approved program under this institution.",
                "action": "Select a valid AICTE-approved program code."
            })

        # 3. Duplicate and Collision Checks
        if apaar and validate_verhoeff(apaar):
            lookup_hash = compute_apaar_lookup_hash(apaar)
            existing_student = db.query(Student).filter(Student.apaar_lookup_hash == lookup_hash).first()

            if existing_student:
                # Check for active enrolments in the same academic year
                active_enrolments = db.query(Enrolment).filter(
                    Enrolment.student_id == existing_student.id,
                    Enrolment.academic_year == academic_year,
                    Enrolment.enrolment_status == "ACTIVE"
                ).all()

                for enr in active_enrolments:
                    if enr.institution_id == institution_id:
                        issues.append({
                            "rule_code": "DUPLICATE_INTERNAL_ENROLMENT",
                            "severity": "HIGH",
                            "explanation": f"Student {name} is already actively enrolled in this institution (Roll {existing_student.student_id}).",
                            "action": "Verify if this is an accidental duplicate submission or program transfer."
                        })
                    else:
                        # Cross-institution duplicate collision
                        other_inst = db.query(Institution).filter(Institution.id == enr.institution_id).first()
                        other_inst_name = other_inst.name if other_inst else enr.institution_id
                        issues.append({
                            "rule_code": "CROSS_INSTITUTION_COLLISION",
                            "severity": "CRITICAL",
                            "explanation": f"Identity collision detected! Student is already actively enrolled at '{other_inst_name}' for academic year {academic_year}.",
                            "action": "Flag for regulatory review. Candidate cannot hold concurrent full-time seats in two AICTE institutions."
                        })

                        # Automatically create/update a DuplicateCase
                        case_id = f"CASE-{apaar[-4:]}-{enr.institution_id[:6]}"
                        existing_case = db.query(DuplicateCase).filter(DuplicateCase.case_id == case_id).first()
                        if not existing_case:
                            new_case = DuplicateCase(
                                case_id=case_id,
                                pseudonymous_id=mask_apaar_id(apaar),
                                student_name=name,
                                primary_institution_id=enr.institution_id,
                                secondary_institution_id=institution_id,
                                academic_year=academic_year,
                                evidence_summary=f"Concurrent full-time enrolment between {other_inst_name} and current institution.",
                                severity="CRITICAL"
                            )
                            db.add(new_case)

        # 4. Supernumerary Quota Compliance Check
        if program:
            # Count current admissions in this program
            current_enrolments = db.query(Enrolment).filter(
                Enrolment.program_id == program.id,
                Enrolment.academic_year == academic_year,
                Enrolment.enrolment_status == "ACTIVE"
            ).all()

            if supernumerary == "TFW":
                tfw_count = sum(1 for e in current_enrolments if e.supernumerary_classification == "TFW")
                if tfw_count >= program.tfw_quota:
                    issues.append({
                        "rule_code": "SUPERNUMERARY_QUOTA_BREACH_TFW",
                        "severity": "HIGH",
                        "explanation": f"Tuition Fee Waiver (TFW) quota limit ({program.tfw_quota}) reached for program {program.program_name}.",
                        "action": "Admit under Regular seat or request special AICTE sanction."
                    })
            elif supernumerary == "EWS":
                ews_count = sum(1 for e in current_enrolments if e.supernumerary_classification == "EWS")
                if ews_count >= program.ews_quota:
                    issues.append({
                        "rule_code": "SUPERNUMERARY_QUOTA_BREACH_EWS",
                        "severity": "HIGH",
                        "explanation": f"EWS quota limit ({program.ews_quota}) reached for program {program.program_name}.",
                        "action": "Verify EWS certificate authenticity; capacity is capped at 10%."
                    })
            elif supernumerary == "NRI":
                nri_count = sum(1 for e in current_enrolments if e.supernumerary_classification == "NRI")
                if nri_count >= program.nri_quota:
                    issues.append({
                        "rule_code": "SUPERNUMERARY_QUOTA_BREACH_NRI",
                        "severity": "HIGH",
                        "explanation": f"NRI quota limit ({program.nri_quota}) reached for program {program.program_name}.",
                        "action": "NRI quota cannot exceed 5% without central AICTE permission."
                    })
            elif supernumerary == "FN_OCI":
                fn_count = sum(1 for e in current_enrolments if e.supernumerary_classification == "FN_OCI")
                if fn_count >= program.fn_oci_quota:
                    issues.append({
                        "rule_code": "SUPERNUMERARY_QUOTA_BREACH_FN_OCI",
                        "severity": "HIGH",
                        "explanation": f"Foreign National/OCI quota limit ({program.fn_oci_quota}) reached.",
                        "action": "Verify Ministry of External Affairs clearance."
                    })

        is_valid = len([i for i in issues if i["severity"] == "CRITICAL"]) == 0
        return is_valid, issues
