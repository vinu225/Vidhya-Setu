import os
from PIL import Image, ImageDraw, ImageFont

def create_workflow_diagram():
    w, h = 2400, 1350  # Crisp 16:9 4K-ready resolution
    bg_color = (255, 255, 255)
    img = Image.new('RGB', (w, h), bg_color)
    draw = ImageDraw.Draw(img)

    # Fonts
    title_font = ImageFont.truetype('arialbd.ttf', 52)
    sub_title_font = ImageFont.truetype('arialbd.ttf', 38)
    card_title_font = ImageFont.truetype('arialbd.ttf', 26)
    card_sub_font = ImageFont.truetype('arial.ttf', 19)
    card_detail_font = ImageFont.truetype('arial.ttf', 16)
    arrow_label_font = ImageFont.truetype('arialbd.ttf', 18)

    # Header
    draw.text((100, 60), "VIDHYA SETU — AICTE APAAR PLATFORM", fill=(15, 23, 42), font=title_font)
    draw.text((100, 125), "REAL-TIME SEAT PARITY & VERIFICATION WORKFLOW", fill=(30, 64, 175), font=sub_title_font)

    # Card Drawing Helper with soft shadow and rounded corners
    def draw_card(x, y, cw, ch, icon_type, title, subtitle, details):
        # Soft drop shadow
        shadow_color = (226, 232, 240)
        for offset in range(8, 0, -2):
            draw.rounded_rectangle([x + offset, y + offset, x + cw + offset, y + ch + offset], radius=24, fill=(241, 245, 249))

        # Main white card background
        draw.rounded_rectangle([x, y, x + cw, y + ch], radius=24, fill=(255, 255, 255), outline=(226, 232, 240), width=3)

        # Draw Icon inside top-left or top-center of card
        icon_cx = x + 60
        icon_cy = y + 65
        draw.rounded_rectangle([icon_cx - 36, icon_cy - 36, icon_cx + 36, icon_cy + 36], radius=16, fill=(248, 250, 252), outline=(203, 213, 225), width=2)

        # Custom Vector-Style Icon Drawings
        if icon_type == 'doc':
            # Document sheets icon
            draw.rectangle([icon_cx - 16, icon_cy - 20, icon_cx + 8, icon_cy + 20], fill=(226, 232, 240), outline=(30, 41, 59), width=2)
            draw.rectangle([icon_cx - 8, icon_cy - 14, icon_cx + 16, icon_cy + 24], fill=(255, 255, 255), outline=(30, 41, 59), width=2)
            draw.line([icon_cx - 3, icon_cy - 4, icon_cx + 11, icon_cy - 4], fill=(30, 41, 59), width=2)
            draw.line([icon_cx - 3, icon_cy + 4, icon_cx + 11, icon_cy + 4], fill=(30, 41, 59), width=2)
            draw.line([icon_cx - 3, icon_cy + 12, icon_cx + 8, icon_cy + 12], fill=(30, 41, 59), width=2)
        elif icon_type == 'ledger':
            # Seat pool ledger icon
            draw.rectangle([icon_cx - 20, icon_cy - 18, icon_cx + 20, icon_cy + 18], fill=(255, 255, 255), outline=(30, 41, 59), width=2)
            draw.line([icon_cx - 20, icon_cy - 6, icon_cx + 20, icon_cy - 6], fill=(37, 99, 235), width=3)
            draw.rectangle([icon_cx - 14, icon_cy, icon_cx + 4, icon_cy + 5], fill=(16, 185, 129))
            draw.rectangle([icon_cx - 14, icon_cy + 8, icon_cx + 12, icon_cy + 13], fill=(59, 130, 246))
        elif icon_type == 'rules':
            # AICTE handbook icon
            draw.rounded_rectangle([icon_cx - 18, icon_cy - 22, icon_cx + 18, icon_cy + 22], radius=4, fill=(15, 23, 42))
            draw.text((icon_cx - 13, icon_cy - 18), "AICTE", fill=(255, 255, 255), font=card_detail_font)
            draw.text((icon_cx - 12, icon_cy - 2), "APH", fill=(255, 255, 255), font=card_detail_font)
            draw.polygon([(icon_cx - 6, icon_cy + 14), (icon_cx + 6, icon_cy + 14), (icon_cx, icon_cy + 22)], fill=(34, 197, 94))
        elif icon_type == 'ai':
            # AI chip processor icon
            draw.rectangle([icon_cx - 20, icon_cy - 20, icon_cx + 20, icon_cy + 20], fill=(37, 99, 235), outline=(30, 58, 138), width=2)
            # Pins
            for p in [-14, -6, 2, 10]:
                draw.line([icon_cx + p, icon_cy - 26, icon_cx + p, icon_cy - 20], fill=(15, 23, 42), width=3)
                draw.line([icon_cx + p, icon_cy + 20, icon_cx + p, icon_cy + 26], fill=(15, 23, 42), width=3)
                draw.line([icon_cx - 26, icon_cy + p, icon_cx - 20, icon_cy + p], fill=(15, 23, 42), width=3)
                draw.line([icon_cx + 20, icon_cy + p, icon_cx + 26, icon_cy + p], fill=(15, 23, 42), width=3)
            draw.text((icon_cx - 11, icon_cy - 12), "AI", fill=(255, 255, 255), font=ImageFont.truetype('arialbd.ttf', 20))
        elif icon_type == 'vault':
            # Merkle database cylinders
            for dy, col in [(-14, (37, 99, 235)), (0, (59, 130, 246)), (14, (96, 165, 250))]:
                draw.ellipse([icon_cx - 20, icon_cy + dy - 7, icon_cx + 20, icon_cy + dy + 7], fill=col, outline=(30, 41, 59), width=2)
        elif icon_type == 'compliance':
            # Checkmark + Shield
            draw.polygon([(icon_cx, icon_cy - 22), (icon_cx + 18, icon_cy - 12), (icon_cx + 18, icon_cy + 8), (icon_cx, icon_cy + 22), (icon_cx - 18, icon_cy + 8), (icon_cx - 18, icon_cy - 12)], fill=(15, 23, 42))
            draw.line([icon_cx - 7, icon_cy, icon_cx - 2, icon_cy + 6], fill=(34, 197, 94), width=3)
            draw.line([icon_cx - 2, icon_cy + 6, icon_cx + 8, icon_cy - 6], fill=(34, 197, 94), width=3)
        elif icon_type == 'map':
            # Surveillance alert shield
            draw.polygon([(icon_cx, icon_cy - 20), (icon_cx + 18, icon_cy - 10), (icon_cx + 18, icon_cy + 10), (icon_cx, icon_cy + 22), (icon_cx - 18, icon_cy + 10), (icon_cx - 18, icon_cy - 10)], fill=(239, 68, 68), outline=(185, 28, 28), width=2)
            draw.text((icon_cx - 4, icon_cy - 12), "!", fill=(255, 255, 255), font=ImageFont.truetype('arialbd.ttf', 24))
        elif icon_type == 'portal':
            # Dual monitor / split view
            draw.rounded_rectangle([icon_cx - 22, icon_cy - 16, icon_cx + 22, icon_cy + 14], radius=3, fill=(15, 23, 42))
            draw.rectangle([icon_cx - 19, icon_cy - 13, icon_cx - 2, icon_cy + 10], fill=(255, 255, 255))
            draw.rectangle([icon_cx + 2, icon_cy - 13, icon_cx + 19, icon_cy + 10], fill=(59, 130, 246))
            draw.line([icon_cx - 8, icon_cy + 18, icon_cx + 8, icon_cy + 18], fill=(15, 23, 42), width=3)
        elif icon_type == 'user':
            # User & Verifier check
            draw.ellipse([icon_cx - 10, icon_cy - 20, icon_cx + 10, icon_cy], fill=(15, 23, 42))
            draw.chord([icon_cx - 20, icon_cy - 2, icon_cx + 20, icon_cy + 24], start=0, end=180, fill=(15, 23, 42))
            draw.ellipse([icon_cx + 4, icon_cy - 16, icon_cx + 20, icon_cy], fill=(16, 185, 129))
            draw.chord([icon_cx - 4, icon_cy, icon_cx + 28, icon_cy + 20], start=0, end=180, fill=(16, 185, 129))

        # Text labels inside card
        tx = x + 120
        draw.text((tx, y + 42), title, fill=(15, 23, 42), font=card_title_font)
        draw.text((tx, y + 78), subtitle, fill=(71, 85, 105), font=card_sub_font)

        # Bullet details
        dy = y + 128
        for bullet in details:
            draw.ellipse([x + 36, dy + 5, x + 44, dy + 13], fill=(37, 99, 235))
            draw.text((x + 56, dy), bullet, fill=(51, 65, 85), font=card_detail_font)
            dy += 26

    # Function to draw clean directional arrows with arrowheads
    def draw_arrow(x1, y1, x2, y2, label=None):
        draw.line([x1, y1, x2, y2], fill=(15, 23, 42), width=3)
        # Calculate arrowhead
        if x2 > x1 and y1 == y2:
            draw.polygon([(x2, y2), (x2 - 12, y2 - 7), (x2 - 12, y2 + 7)], fill=(15, 23, 42))
        elif x1 == x2 and y2 > y1:
            draw.polygon([(x2, y2), (x2 - 7, y2 - 12), (x2 + 7, y2 - 12)], fill=(15, 23, 42))
        elif x2 < x1 and y1 == y2:
            draw.polygon([(x2, y2), (x2 + 12, y2 - 7), (x2 + 12, y2 + 7)], fill=(15, 23, 42))
        elif x1 == x2 and y2 < y1:
            draw.polygon([(x2, y2), (x2 - 7, y2 + 12), (x2 + 7, y2 + 12)], fill=(15, 23, 42))

        if label:
            # Draw label box in middle
            mx, my = (x1 + x2) // 2, (y1 + y2) // 2
            bbox = draw.textbbox((mx, my), label, font=arrow_label_font)
            pad = 6
            draw.rounded_rectangle([bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad], radius=4, fill=(255, 255, 255), outline=(203, 213, 225))
            draw.text((mx, my), label, fill=(15, 23, 42), font=arrow_label_font, anchor="mm")

    # Layout Dimensions
    card_w = 420
    card_h = 240
    col1_x = 100
    col2_x = 600
    col3_x = 1100
    col4_x = 1700
    col4_w = 600

    row1_y = 220
    row2_y = 570

    # 1. Col 1, Row 1: Admissions & Batch Ingestion
    draw_card(
        col1_x, row1_y, card_w, card_h,
        icon_type='doc',
        title="Admissions & Ingestion",
        subtitle="CSV, XLSX & Scanned Records",
        details=[
            "Instant dry-run pre-commit validation",
            "Verhoeff mathematical APAAR format check",
            "Isolated 'Rows to Fix' error queue"
        ]
    )

    # 2. Col 1, Row 2: Multi-Pool Seat Ledger
    draw_card(
        col1_x, row2_y, card_w, card_h,
        icon_type='ledger',
        title="Multi-Pool Seat Ledger",
        subtitle="Capacity & Quota Management",
        details=[
            "Strict separation: Regular, TFW, NRI & OCI",
            "Real-time intake progress tracking",
            "Zero cross-pool quota bleeding"
        ]
    )

    # 3. Col 2, Row 1: AICTE Statutory Guidelines
    draw_card(
        col2_x, row1_y, card_w, card_h,
        icon_type='rules',
        title="Statutory Guidelines",
        subtitle="AICTE APH Rules & Handbook",
        details=[
            "Sanctioned intake capacity enforcement",
            "Statutory deadline lock (APH Clause 7.1)",
            "Dynamic no-code rule updates"
        ]
    )

    # 4. Col 2, Row 2: AI Validation & ML Engine
    draw_card(
        col2_x, row2_y, card_w, card_h,
        icon_type='ai',
        title="AI Validation Engine",
        subtitle="Isolation Forest & Surge Check",
        details=[
            "Unsupervised admission spike clustering",
            "OCR metadata chronological forensics",
            "Dynamic 0–100 college integrity scoring"
        ]
    )

    # 5. Col 3, Row 1: Immutable Audit Vault
    draw_card(
        col3_x, row1_y, card_w, card_h,
        icon_type='vault',
        title="Immutable Audit Vault",
        subtitle="SHA-256 Merkle Ledger",
        details=[
            "Tamper-proof digital mutation chain",
            "Mathematical cryptographic verification",
            "Complete DPDP Act 2023 compliance"
        ]
    )

    # 6. Col 3, Row 2: Blind Match Privacy Engine
    draw_card(
        col3_x, row2_y, card_w, card_h,
        icon_type='compliance',
        title="Compliance & Privacy",
        subtitle="Blind Match Cryptographic Engine",
        details=[
            "Zero-PII Bloom filter demographic hashing",
            "Cross-institution duplicate student detection",
            "Dice similarity scoring with zero leaks"
        ]
    )

    # 7. Col 4, Row 1: National Surveillance Map & Anomaly Alert
    draw_card(
        col4_x, 200, col4_w, 200,
        icon_type='map',
        title="National Geo-Spatial Surveillance",
        subtitle="Real-Time State Intake Parity & Alert Center",
        details=[
            "Interactive India map with state intake % & anomaly counts",
            "Instant red-flagging of over-intake breaches (>100% capacity)",
            "One-click regional filtering for regulatory show-cause audits"
        ]
    )

    # 8. Col 4, Row 2: Centralized Student Portal
    draw_card(
        col4_x, 440, col4_w, 210,
        icon_type='portal',
        title="Centralized Student Portal",
        subtitle="Single Window APAAR Program Tracker",
        details=[
            "Track all enrolled AICTE programs across institutions",
            "One-click 'Confirm' or 'Dispute' anti-ghost enrolment actions",
            "Download tamper-evident official AICTE certificates (PDF)"
        ]
    )

    # 9. Col 4, Row 3: Regulatory & Public Verifier
    draw_card(
        col4_x, 690, col4_w, 200,
        icon_type='user',
        title="Regulatory Action & Verifier",
        subtitle="Zero-Server Offline QR Verification",
        details=[
            "In-browser TweetNaCl Ed25519 cryptographic scan",
            "Instant offline validation without contacting central servers",
            "Decision triage: Verified, Needs Clarification, Flagged"
        ]
    )

    # Connectors & Arrows:
    # Card 1 -> Card 2
    draw_arrow(col1_x + card_w // 2, row1_y + card_h, col1_x + card_w // 2, row2_y)
    # Card 1 -> Card 3
    draw_arrow(col1_x + card_w, row1_y + card_h // 2, col2_x, row1_y + card_h // 2)
    # Card 2 -> Card 4
    draw_arrow(col1_x + card_w, row2_y + card_h // 2, col2_x, row2_y + card_h // 2)
    # Card 3 -> Card 4
    draw_arrow(col2_x + card_w // 2, row1_y + card_h, col2_x + card_w // 2, row2_y)

    # Card 4 splits into Card 5 and Card 6
    draw.line([col2_x + card_w, row2_y + card_h // 2, col3_x - 40, row2_y + card_h // 2], fill=(15, 23, 42), width=3)
    draw.line([col3_x - 40, row1_y + card_h // 2, col3_x - 40, row2_y + card_h // 2], fill=(15, 23, 42), width=3)
    # Arrow into Card 5
    draw_arrow(col3_x - 40, row1_y + card_h // 2, col3_x, row1_y + card_h // 2)
    # Arrow into Card 6
    draw_arrow(col3_x - 40, row2_y + card_h // 2, col3_x, row2_y + card_h // 2)

    # Card 5 -> Outputs
    draw.line([col3_x + card_w, row1_y + card_h // 2, 1620, row1_y + card_h // 2], fill=(15, 23, 42), width=3)
    draw.line([1620, row1_y + card_h // 2, 1620, 790], fill=(15, 23, 42), width=3)
    # Arrow into Card 7
    draw_arrow(1620, 300, col4_x, 300)
    # Arrow into Card 8
    draw_arrow(1620, 545, col4_x, 545)
    # Arrow into Card 9
    draw_arrow(1620, 790, col4_x, 790)

    # Card 6 -> Outputs
    draw.line([col3_x + card_w, row2_y + card_h // 2, 1620, row2_y + card_h // 2], fill=(15, 23, 42), width=3)

    # Return loop: From Card 9 back to AI Engine
    loop_y = 1000
    draw.line([col4_x + col4_w // 2, 890, col4_x + col4_w // 2, loop_y], fill=(15, 23, 42), width=3)
    draw.line([col4_x + col4_w // 2, loop_y, col2_x + card_w // 2, loop_y], fill=(15, 23, 42), width=3)
    draw_arrow(col2_x + card_w // 2, loop_y, col2_x + card_w // 2, row2_y + card_h, label="Regulatory Decision & Triage Feedback Loop")

    # Bottom Statistics Banner
    draw.rounded_rectangle([100, 1080, 2300, 1260], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    stat_font = ImageFont.truetype('arialbd.ttf', 24)
    stat_sub_font = ImageFont.truetype('arial.ttf', 16)

    # 4 Key Metrics
    metrics = [
        ("⚡ 100% Real-Time Parity", "Zero intake overruns & quota bleeding"),
        ("🛡️ DPDP Act 2023 Compliant", "Cryptographic Bloom filter blind matching"),
        ("📜 SHA-256 Merkle Chain", "Mathematically tamper-evident audit ledger"),
        ("📊 Benchmark Validated", "Tested across 241 institutions & 3,500+ records")
    ]
    stat_x = 160
    for title, desc in metrics:
        draw.text((stat_x, 1120), title, fill=(15, 23, 42), font=stat_font)
        draw.text((stat_x, 1170), desc, fill=(71, 85, 105), font=stat_sub_font)
        stat_x += 540

    # Save to locations
    out_paths = [
        "vidhya_setu_feature_workflow.png",
        os.path.join("frontend", "public", "vidhya_setu_feature_workflow.png"),
        r"C:\Users\vinuj\.gemini\antigravity\brain\ab914751-9c91-45cc-ad2b-4b2cddb829db\vidhya_setu_feature_workflow.png"
    ]
    for p in out_paths:
        os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
        img.save(p, quality=95)
        print(f"Saved diagram to: {p}")

create_workflow_diagram()

