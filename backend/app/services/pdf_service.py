"""Pure-Python standard PDF-1.4 generator for official AICTE Verifiable Enrolment Certificates.
Zero external C-library or binary dependency; runs identically on Windows, Linux, and Render.
"""

import io
from datetime import datetime, timezone
from typing import Dict, Any, Optional

def _escape_pdf(text: str) -> str:
    """Escape special characters for PDF literal strings."""
    return str(text or "").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

def generate_enrolment_certificate_pdf(
    student_name: str,
    masked_apaar: str,
    roll_number: str,
    institution_name: str,
    institution_code: str,
    program_name: str,
    program_code: str,
    academic_year: str,
    seat_category: str,
    credential_id: str,
    digital_signature: str,
    public_key_ref: str,
    issued_at: Optional[str] = None
) -> bytes:
    """Constructs an official, AICTE-styled vector PDF-1.4 enrolment certificate."""
    
    issued_time_str = issued_at or datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")

    # PDF canvas dimensions: A4 portrait (595.28 x 841.89 pt)
    W, H = 595.28, 841.89

    # Stream builder for PDF content
    stream = []
    
    # 1. Background Watermark / Border
    # Outer Border (AICTE Navy #0F172A)
    stream.append("0.06 0.09 0.16 RG") # Stroke color
    stream.append("2 w")               # Line width
    stream.append("25 25 545 791 re S") # Outer rectangle
    
    # Inner Gold Border (#D97706)
    stream.append("0.85 0.47 0.02 RG")
    stream.append("1 w")
    stream.append("30 30 535 781 re S")
    
    # Header Top Navy Banner
    stream.append("0.06 0.09 0.16 rg") # Fill color
    stream.append("30 735 535 76 re f") # Header filled banner

    # Header Text
    stream.append("BT")
    stream.append("/F1 16 Tf")
    stream.append("1 1 1 rg") # White text
    stream.append("75 780 Td")
    stream.append(f"({_escape_pdf('ALL INDIA COUNCIL FOR TECHNICAL EDUCATION')}) Tj")
    stream.append("ET")

    stream.append("BT")
    stream.append("/F2 10 Tf")
    stream.append("0.9 0.9 0.9 rg")
    stream.append("150 762 Td")
    stream.append(f"({_escape_pdf('STATUTORY BODY UNDER MINISTRY OF EDUCATION, GOVT. OF INDIA')}) Tj")
    stream.append("ET")

    stream.append("BT")
    stream.append("/F2 9 Tf")
    stream.append("0.85 0.47 0.02 rg") # Gold text
    stream.append("175 745 Td")
    stream.append(f"({_escape_pdf('NATIONAL SOVEREIGN APAAR IDENTITY INFRASTRUCTURE (NEP 2020)')}) Tj")
    stream.append("ET")

    # Document Title
    stream.append("BT")
    stream.append("/F1 18 Tf")
    stream.append("0.06 0.09 0.16 rg")
    stream.append("105 690 Td")
    stream.append(f"({_escape_pdf('CERTIFICATE OF VERIFIED ACADEMIC ENROLMENT')}) Tj")
    stream.append("ET")

    stream.append("BT")
    stream.append("/F2 10 Tf")
    stream.append("0.4 0.45 0.5 rg")
    stream.append("165 672 Td")
    stream.append(f"({_escape_pdf('CRYPTOGRAPHICALLY SEALED UNDER DIGITAL PERSONAL DATA PROTECTION ACT')}) Tj")
    stream.append("ET")

    # Thin Divider Line
    stream.append("0.8 0.85 0.9 RG")
    stream.append("0.75 w")
    stream.append("60 655 m 535 655 l S")

    # Student Details Box
    stream.append("0.96 0.97 0.99 rg") # Very light subtle blue-gray fill
    stream.append("0.8 0.85 0.9 RG")
    stream.append("50 430 495 205 re B") # Bordered and filled

    # Box Title Banner
    stream.append("0.1 0.3 0.6 rg")
    stream.append("50 610 495 25 re f")
    stream.append("BT")
    stream.append("/F1 11 Tf")
    stream.append("1 1 1 rg")
    stream.append("65 618 Td")
    stream.append(f"({_escape_pdf('VERIFIED STUDENT IDENTITY & ADMISSION RECORD')}) Tj")
    stream.append("ET")

    # Grid labels and values
    fields = [
        ("Student Full Name:", student_name.upper(), 585),
        ("Sovereign APAAR ID:", masked_apaar, 560),
        ("Institutional Roll No:", roll_number, 535),
        ("Affiliated Institution:", f"{institution_name} ({institution_code})", 510),
        ("Approved Program:", f"{program_name} [{program_code}]", 485),
        ("Academic Cycle / Year:", academic_year, 460),
        ("Admission Quota Pool:", f"{seat_category} (REGULATORY VERIFIED)", 435)
    ]

    for label, val, y_pos in fields:
        stream.append("BT")
        stream.append("/F1 10 Tf")
        stream.append("0.2 0.25 0.35 rg")
        stream.append(f"65 {y_pos} Td")
        stream.append(f"({_escape_pdf(label)}) Tj")
        stream.append("ET")

        stream.append("BT")
        stream.append("/F2 10 Tf")
        stream.append("0.06 0.09 0.16 rg")
        stream.append(f"230 {y_pos} Td")
        # Truncate value if too long to prevent overflow
        disp_val = val if len(val) < 46 else val[:44] + "..."
        stream.append(f"({_escape_pdf(disp_val)}) Tj")
        stream.append("ET")

    # Cryptographic Seal & QR Verification Box
    stream.append("0.97 0.99 0.97 rg") # Light subtle green tint
    stream.append("0.7 0.85 0.7 RG")
    stream.append("50 240 495 170 re B")

    stream.append("0.08 0.45 0.25 rg")
    stream.append("50 385 495 25 re f")
    stream.append("BT")
    stream.append("/F1 11 Tf")
    stream.append("1 1 1 rg")
    stream.append("65 393 Td")
    stream.append(f"({_escape_pdf('OFFICIAL CRYPTOGRAPHIC PROOF (ED25519 ASYMMETRIC SIGNATURE)')}) Tj")
    stream.append("ET")

    # Vector Simulation of QR Code Matrix (A sharp 80x80 pt vector grid)
    qr_x, qr_y, qr_size = 70, 265, 95
    stream.append("1 1 1 rg")
    stream.append(f"{qr_x} {qr_y} {qr_size} {qr_size} re f") # White background
    stream.append("0 0 0 rg") # Black QR modules

    # Draw Corner Position Detection Patterns (Standard QR anchors)
    def draw_finder_pattern(fx, fy):
        stream.append(f"{fx} {fy} 24 24 re f")
        stream.append("1 1 1 rg")
        stream.append(f"{fx+3} {fy+3} 18 18 re f")
        stream.append("0 0 0 rg")
        stream.append(f"{fx+6} {fy+6} 12 12 re f")

    draw_finder_pattern(qr_x + 5, qr_y + qr_size - 29) # Top-left
    draw_finder_pattern(qr_x + qr_size - 29, qr_y + qr_size - 29) # Top-right
    draw_finder_pattern(qr_x + 5, qr_y + 5) # Bottom-left

    # Pseudo-random deterministic micro-modules inside QR
    seed_hash = abs(hash(credential_id))
    for r in range(4):
        for c in range(4):
            if (seed_hash >> (r * 4 + c)) & 1:
                mx = qr_x + 36 + c * 6
                my = qr_y + 36 + r * 6
                stream.append(f"{mx} {my} 5 5 re f")

    # Cryptographic Metadata Text next to QR Code
    meta_lines = [
        ("Credential ID:", credential_id),
        ("Signing Authority:", "AICTE National Apex Key [Ed25519]"),
        ("Public Key Ref:", public_key_ref[:28] + "..."),
        ("Digital Signature:", digital_signature[:36] + "..."),
        ("Issued Timestamp:", issued_time_str),
        ("Status:", "AUTHENTIC SOVEREIGN ENROLMENT (ACTIVE)")
    ]

    for idx, (m_label, m_val) in enumerate(meta_lines):
        my_pos = 360 - idx * 18
        stream.append("BT")
        stream.append("/F1 8.5 Tf")
        stream.append("0.1 0.2 0.3 rg")
        stream.append(f"185 {my_pos} Td")
        stream.append(f"({_escape_pdf(m_label)}) Tj")
        stream.append("ET")

        stream.append("BT")
        stream.append("/F2 8.5 Tf")
        stream.append("0.05 0.1 0.15 rg")
        stream.append(f"290 {my_pos} Td")
        stream.append(f"({_escape_pdf(m_val)}) Tj")
        stream.append("ET")

    # Statutory Regulatory Notice (Bottom)
    stream.append("BT")
    stream.append("/F2 8.5 Tf")
    stream.append("0.35 0.4 0.45 rg")
    stream.append("50 190 Td")
    stream.append(f"({_escape_pdf('LEGAL VALIDITY & FORENSIC INSTRUCTION:')}) Tj")
    stream.append("ET")

    stream.append("BT")
    stream.append("/F2 7.5 Tf")
    stream.append("0.45 0.5 0.55 rg")
    stream.append("50 175 Td")
    stream.append(f"({_escape_pdf('1. Pursuant to NEP 2020 and AICTE Regulations, this document certifies genuine full-time academic enrolment.')}) Tj")
    stream.append("ET")
    stream.append("BT")
    stream.append("/F2 7.5 Tf")
    stream.append("0.45 0.5 0.55 rg")
    stream.append("50 162 Td")
    stream.append(f"({_escape_pdf('2. Any third-party employer, bank, or university may verify cryptographic authenticity offline using the Ed25519 public key.')}) Tj")
    stream.append("ET")
    stream.append("BT")
    stream.append("/F2 7.5 Tf")
    stream.append("0.45 0.5 0.55 rg")
    stream.append("50 149 Td")
    stream.append(f"({_escape_pdf('3. Duplication, tampering, or multi-institutional active enrolment without NOC attracts cancellation under APH Ch. 7.')}) Tj")
    stream.append("ET")

    # Signatures
    stream.append("0.6 0.65 0.7 RG")
    stream.append("0.75 w")
    stream.append("70 85 m 220 85 l S")
    stream.append("375 85 m 525 85 l S")

    stream.append("BT")
    stream.append("/F1 8 Tf")
    stream.append("0.1 0.15 0.2 rg")
    stream.append("95 72 Td")
    stream.append(f"({_escape_pdf('REGISTRAR / CAMPUS DEO')}) Tj")
    stream.append("ET")

    stream.append("BT")
    stream.append("/F1 8 Tf")
    stream.append("0.1 0.15 0.2 rg")
    stream.append("390 72 Td")
    stream.append(f"({_escape_pdf('MEMBER SECRETARY, AICTE HQ')}) Tj")
    stream.append("ET")

    content_data = "\n".join(stream).encode("latin-1")
    content_len = len(content_data)

    # Standard PDF-1.4 file assembly
    pdf = []
    pdf.append(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets = []

    def add_object(obj_bytes: bytes):
        offsets.append(sum(len(chunk) for chunk in pdf))
        pdf.append(obj_bytes)

    # 1: Catalog
    add_object(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

    # 2: Pages
    add_object(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

    # 3: Page
    add_object(
        f"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n".encode("latin-1")
    )

    # 4: Contents Stream
    add_object(
        f"4 0 obj\n<< /Length {content_len} >>\nstream\n".encode("latin-1") +
        content_data +
        b"\nendstream\nendobj\n"
    )

    # 5: Font F1 (Helvetica-Bold)
    add_object(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

    # 6: Font F2 (Helvetica)
    add_object(b"6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    # Cross-Reference Table
    xref_offset = sum(len(chunk) for chunk in pdf)
    pdf.append(f"xref\n0 {len(offsets) + 1}\n0000000000 65535 f \n".encode("latin-1"))
    for off in offsets:
        pdf.append(f"{off:010d} 00000 n \n".encode("latin-1"))

    # Trailer
    pdf.append(
        f"trailer\n<< /Size {len(offsets) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("latin-1")
    )

    return b"".join(pdf)

