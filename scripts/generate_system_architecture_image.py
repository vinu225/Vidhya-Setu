import os
from PIL import Image, ImageDraw, ImageFont

def generate_system_architecture():
    w, h = 2400, 1350  # 16:9 Presentation Slide Dimension
    img = Image.new('RGB', (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Fonts
    title_font = ImageFont.truetype('arialbd.ttf', 52)
    sub_title_font = ImageFont.truetype('arialbd.ttf', 34)
    panel_tag_font = ImageFont.truetype('arialbd.ttf', 24)
    node_title_font = ImageFont.truetype('arialbd.ttf', 23)
    node_sub_font = ImageFont.truetype('arial.ttf', 17)
    node_desc_font = ImageFont.truetype('arial.ttf', 15)
    arrow_label_font = ImageFont.truetype('arialbd.ttf', 16)

    # Header
    draw.text((80, 50), "VIDHYA SETU — SYSTEM ARCHITECTURE & DATA FLOW", fill=(15, 23, 42), font=title_font)
    draw.text((80, 115), "END-TO-END CRYPTOGRAPHIC SEAT PARITY & VERIFICATION ENGINE (SIH 26263)", fill=(37, 99, 235), font=sub_title_font)

    # Colors
    border_teal = (15, 118, 110)
    bg_panel = (248, 250, 252)
    border_panel = (203, 213, 225)
    navy_ink = (15, 23, 42)
    slate_sub = (71, 85, 105)
    blue_brand = (37, 99, 235)

    # Helper: Panel Card Container
    def draw_panel(px, py, pw, ph, tag_text):
        draw.rounded_rectangle([px, py, px + pw, py + ph], radius=24, fill=(255, 255, 255), outline=border_panel, width=3)
        # Tag header at top-left
        tag_w = draw.textlength(tag_text, font=panel_tag_font) + 40
        draw.rounded_rectangle([px + 24, py + 18, px + 24 + tag_w, py + 64], radius=10, fill=(241, 245, 249), outline=(203, 213, 225), width=2)
        draw.text((px + 44, py + 26), tag_text, fill=navy_ink, font=panel_tag_font)

    # Draw 3 Main Panels
    p1_x, p1_y, p1_w, p1_h = 80, 180, 680, 1110
    p2_x, p2_y, p2_w, p2_h = 790, 180, 480, 1110
    p3_x, p3_y, p3_w, p3_h = 1300, 180, 1020, 1110

    draw_panel(p1_x, p1_y, p1_w, p1_h, "📥 DATA INGESTION")
    draw_panel(p2_x, p2_y, p2_w, p2_h, "⚙️ PROCESSING & INTELLIGENCE")
    draw_panel(p3_x, p3_y, p3_w, p3_h, "🖥️ FRONTEND INTERACTION & PORTALS")

    # Helper: Draw Node Box with Shadow
    def draw_node(nx, ny, nw, nh, icon_type, title, subtitle, bullets=None):
        # Soft shadow
        draw.rounded_rectangle([nx + 4, ny + 4, nx + nw + 4, ny + nh + 4], radius=18, fill=(241, 245, 249))
        draw.rounded_rectangle([nx, ny, nx + nw, ny + nh], radius=18, fill=(255, 255, 255), outline=(226, 232, 240), width=2)

        # Icon box
        ic_x, ic_y = nx + 48, ny + nh // 2
        draw.rounded_rectangle([ic_x - 32, ic_y - 32, ic_x + 32, ic_y + 32], radius=12, fill=(248, 250, 252), outline=(203, 213, 225), width=1)

        # Draw custom icon
        if icon_type == 'doc_scan':
            draw.rectangle([ic_x - 14, ic_y - 18, ic_x + 8, ic_y + 18], fill=(226, 232, 240), outline=navy_ink, width=2)
            draw.rectangle([ic_x - 8, ic_y - 12, ic_x + 14, ic_y + 22], fill=(255, 255, 255), outline=navy_ink, width=2)
        elif icon_type == 'excel':
            draw.rectangle([ic_x - 16, ic_y - 18, ic_x + 16, ic_y + 18], fill=(236, 253, 245), outline=(16, 185, 129), width=2)
            draw.line([ic_x - 16, ic_y, ic_x + 16, ic_y], fill=(16, 185, 129), width=2)
            draw.line([ic_x, ic_y - 18, ic_x, ic_y + 18], fill=(16, 185, 129), width=2)
        elif icon_type == 'api':
            draw.ellipse([ic_x - 16, ic_y - 16, ic_x + 16, ic_y + 16], fill=(239, 246, 255), outline=blue_brand, width=2)
            draw.text((ic_x - 14, ic_y - 8), "API", fill=blue_brand, font=ImageFont.truetype('arialbd.ttf', 13))
        elif icon_type == 'db_vault':
            for dy, col in [(-12, (37, 99, 235)), (2, (59, 130, 246)), (16, (96, 165, 250))]:
                draw.ellipse([ic_x - 18, ic_y + dy - 6, ic_x + 18, ic_y + dy + 6], fill=col, outline=navy_ink, width=2)
        elif icon_type == 'math':
            draw.text((ic_x - 16, ic_y - 18), "π / √", fill=blue_brand, font=ImageFont.truetype('arialbd.ttf', 20))
        elif icon_type == 'gavel':
            draw.line([ic_x - 14, ic_y + 14, ic_x + 6, ic_y - 6], fill=navy_ink, width=4)
            draw.rectangle([ic_x + 2, ic_y - 14, ic_x + 16, ic_y - 2], fill=(245, 158, 11), outline=navy_ink, width=2)
        elif icon_type == 'graph':
            draw.circle((ic_x - 12, ic_y - 10), 6, fill=blue_brand)
            draw.circle((ic_x + 12, ic_y - 10), 6, fill=(16, 185, 129))
            draw.circle((ic_x, ic_y + 12), 6, fill=(239, 68, 68))
            draw.line([ic_x - 12, ic_y - 10, ic_x + 12, ic_y - 10], fill=navy_ink, width=2)
            draw.line([ic_x - 12, ic_y - 10, ic_x, ic_y + 12], fill=navy_ink, width=2)
            draw.line([ic_x + 12, ic_y - 10, ic_x, ic_y + 12], fill=navy_ink, width=2)
        elif icon_type == 'ai_brain':
            draw.ellipse([ic_x - 16, ic_y - 16, ic_x + 16, ic_y + 16], fill=(238, 242, 255), outline=(99, 102, 241), width=2)
            draw.text((ic_x - 10, ic_y - 9), "AI", fill=(99, 102, 241), font=ImageFont.truetype('arialbd.ttf', 16))
        elif icon_type == 'split_map':
            draw.rectangle([ic_x - 18, ic_y - 14, ic_x + 18, ic_y + 14], fill=navy_ink)
            draw.rectangle([ic_x - 15, ic_y - 11, ic_x - 1, ic_y + 11], fill=(255, 255, 255))
            draw.rectangle([ic_x + 1, ic_y - 11, ic_x + 15, ic_y + 11], fill=(59, 130, 246))
        elif icon_type == 'risk_flags':
            draw.polygon([(ic_x - 12, ic_y - 14), (ic_x + 2, ic_y - 8), (ic_x - 12, ic_y - 2)], fill=(239, 68, 68))
            draw.polygon([(ic_x, ic_y - 4), (ic_x + 14, ic_y + 2), (ic_x, ic_y + 8)], fill=(245, 158, 11))
            draw.line([ic_x - 12, ic_y - 14, ic_x - 12, ic_y + 16], fill=navy_ink, width=2)
            draw.line([ic_x, ic_y - 4, ic_x, ic_y + 16], fill=navy_ink, width=2)
        elif icon_type == 'copilot':
            draw.ellipse([ic_x - 16, ic_y - 14, ic_x + 16, ic_y + 14], fill=(240, 253, 250), outline=(13, 148, 136), width=2)
            draw.text((ic_x - 8, ic_y - 8), "🤖", fill=(13, 148, 136), font=ImageFont.truetype('arial.ttf', 16))
        elif icon_type == 'officer':
            draw.circle((ic_x, ic_y - 8), 10, fill=navy_ink)
            draw.chord([ic_x - 16, ic_y, ic_x + 16, ic_y + 24], start=0, end=180, fill=navy_ink)
        elif icon_type == 'vault_safe':
            draw.rounded_rectangle([ic_x - 18, ic_y - 18, ic_x + 18, ic_y + 18], radius=6, fill=(15, 23, 42))
            draw.circle((ic_x, ic_y), 7, fill=(34, 197, 94))

        # Typography inside node
        tx = nx + 96
        draw.text((tx, ny + 18), title, fill=navy_ink, font=node_title_font)
        draw.text((tx, ny + 48), subtitle, fill=slate_sub, font=node_sub_font)

        if bullets:
            by = ny + 78
            for b in bullets:
                draw.text((tx, by), "• " + b, fill=(51, 65, 85), font=node_desc_font)
                by += 22

    # Draw Arrow helper
    def draw_arrow(x1, y1, x2, y2):
        draw.line([x1, y1, x2, y2], fill=(15, 23, 42), width=3)
        if x2 > x1 and y1 == y2:
            draw.polygon([(x2, y2), (x2 - 12, y2 - 7), (x2 - 12, y2 + 7)], fill=(15, 23, 42))
        elif x1 == x2 and y2 > y1:
            draw.polygon([(x2, y2), (x2 - 7, y2 - 12), (x2 + 7, y2 - 12)], fill=(15, 23, 42))
        elif x2 < x1 and y1 == y2:
            draw.polygon([(x2, y2), (x2 + 12, y2 - 7), (x2 + 12, y2 + 7)], fill=(15, 23, 42))
        elif x1 == x2 and y2 < y1:
            draw.polygon([(x2, y2), (x2 - 7, y2 + 12), (x2 + 7, y2 + 12)], fill=(15, 23, 42))

    # ----------------------------------------------------
    # PANEL 1: DATA INGESTION
    # ----------------------------------------------------
    in_w = 260
    in_h = 180
    in_x = p1_x + 36

    # Source 1: Student Documents & Marksheets
    draw_node(
        in_x, 260, in_w, in_h,
        icon_type='doc_scan',
        title="Student Uploads",
        subtitle="PDF / Vector Text / OCR",
        bullets=["Forensic metadata check", "Chronology validation"]
    )

    # Source 2: Institution Batch Admissions
    draw_node(
        in_x, 480, in_w, in_h,
        icon_type='excel',
        title="Batch Admissions",
        subtitle="Bulk CSV / XLSX Uploads",
        bullets=["Dry-run atomic parsing", "Rows to Fix error queue"]
    )

    # Source 3: Government Registry APIs
    draw_node(
        in_x, 700, in_w, in_h,
        icon_type='api',
        title="Sovereign APIs",
        subtitle="APAAR / AISHE Gateways",
        bullets=["External API auth keys", "HMAC-signed webhooks"]
    )

    # Target Node in Panel 1: PostgreSQL & Secure Document Vault
    db_x = p1_x + 350
    db_y = 390
    db_w = 290
    db_h = 380
    draw_node(
        db_x, db_y, db_w, db_h,
        icon_type='db_vault',
        title="PostgreSQL & Vault",
        subtitle="Supabase DB & Audit Vault",
        bullets=[
            "AES-256 at-rest encryption",
            "SHA-256 tamper-evident logs",
            "Realtime websocket events",
            "In-memory Redis caching",
            "Seat pool ledger states"
        ]
    )

    # Connectors from Ingestion sources to Database Vault
    draw_arrow(in_x + in_w, 350, db_x, 480)
    draw_arrow(in_x + in_w, 570, db_x, 570)
    draw_arrow(in_x + in_w, 790, db_x, 660)

    # ----------------------------------------------------
    # PANEL 2: PROCESSING & INTELLIGENCE
    # ----------------------------------------------------
    eng_x = p2_x + 30
    eng_w = 420
    eng_h = 175

    # Engine 1: Verhoeff Parity Engine
    draw_node(
        eng_x, 260, eng_w, eng_h,
        icon_type='math',
        title="Verhoeff Parity Engine",
        subtitle="12-Digit Sovereign APAAR Check",
        bullets=["Dihedral D5 mathematical validation", "Catches transposition & typo fraud"]
    )

    # Engine 2: APH Statutory Rule Engine
    draw_node(
        eng_x, 460, eng_w, eng_h,
        icon_type='gavel',
        title="APH Statutory Seat Engine",
        subtitle="Intake Norms & Window Locking",
        bullets=["Regular, TFW, NRI, FN/OCI capacities", "Statutory deadline lock (Clause 7.1)"]
    )

    # Engine 3: Blind Match & Graph Engine
    draw_node(
        eng_x, 660, eng_w, eng_h,
        icon_type='graph',
        title="Blind Match & Graph Engine",
        subtitle="Zero-PII Duplicate Enrolment Hunter",
        bullets=["Cryptographic Bloom filter hashing", "NetworkX bipartite collision graph"]
    )

    # Engine 4: ML Anomaly Scorer
    draw_node(
        eng_x, 860, eng_w, eng_h,
        icon_type='ai_brain',
        title="Isolation Forest ML Scorer",
        subtitle="Unsupervised Anomaly Clustering",
        bullets=["Dynamic 0–100 institution integrity", "Explainable top anomaly features"]
    )

    # Connectors from DB Vault into Processing Engines
    draw.line([db_x + db_w, 570, eng_x - 30, 570], fill=navy_ink, width=3)
    draw.line([eng_x - 30, 345, eng_x - 30, 945], fill=navy_ink, width=3)
    draw_arrow(eng_x - 30, 345, eng_x, 345)
    draw_arrow(eng_x - 30, 545, eng_x, 545)
    draw_arrow(eng_x - 30, 745, eng_x, 745)
    draw_arrow(eng_x - 30, 945, eng_x, 945)

    # Continuous Feedback Loop on ML Scorer
    draw.arc([eng_x + eng_w - 60, 940, eng_x + eng_w + 30, 1020], start=270, end=90, fill=blue_brand, width=3)
    draw.polygon([(eng_x + eng_w - 60, 1020), (eng_x + eng_w - 50, 1014), (eng_x + eng_w - 50, 1026)], fill=blue_brand)
    draw.text((eng_x + eng_w - 110, 1030), "Continuous Feedback", fill=slate_sub, font=node_desc_font)

    # ----------------------------------------------------
    # PANEL 3: FRONTEND INTERACTION & MULTI-PORTAL
    # ----------------------------------------------------
    top_w = 300
    top_h = 220
    top_y = 260
    t1_x = p3_x + 30
    t2_x = p3_x + 360
    t3_x = p3_x + 690

    # Top Item 1: Geo-Spatial Surveillance Map
    draw_node(
        t1_x, top_y, top_w, top_h,
        icon_type='split_map',
        title="Surveillance Map",
        subtitle="National Geo-Spatial Heat",
        bullets=["State intake % parity", "Red alert overrun flags", "One-click state filter"]
    )

    # Top Item 2: Compliance & Risk Matrix
    draw_node(
        t2_x, top_y, top_w, top_h,
        icon_type='risk_flags',
        title="Exception Queue",
        subtitle="Flagged Case Triage",
        bullets=["Seat overruns review", "Dual enrolment alerts", "Mandatory audit reasons"]
    )

    # Top Item 3: Auditor AI Co-Pilot
    draw_node(
        t3_x, top_y, top_w, top_h,
        icon_type='copilot',
        title="AI Regulatory Co-Pilot",
        subtitle="Audit & Handbook Assistant",
        bullets=["Approval handbook Q&A", "Regulatory citations", "Audit recommendations"]
    )

    # Connectors from Processing to Frontend
    draw.line([eng_x + eng_w, 345, t1_x - 30, 345], fill=navy_ink, width=3)
    draw.line([t1_x - 30, 345, t1_x - 30, 370], fill=navy_ink, width=3)
    draw_arrow(t1_x - 30, 370, t1_x, 370)

    draw.line([eng_x + eng_w, 745, t2_x - 30, 745], fill=navy_ink, width=3)
    draw.line([t2_x - 30, 745, t2_x - 30, 480], fill=navy_ink, width=3)
    draw_arrow(t2_x - 30, 480, t2_x, 480)

    # Middle Human Decision Node
    dec_x = p3_x + 220
    dec_y = 540
    dec_w = 580
    dec_h = 160
    draw_node(
        dec_x, dec_y, dec_w, dec_h,
        icon_type='officer',
        title="Regulatory Decision & Triage Workflow",
        subtitle="AICTE Admin & Auditor Governance Decisions",
        bullets=[
            "Triage decisions: Verified / Needs Clarification / Flagged for Forensic Audit",
            "Digitally signed exception approvals for post-lock submission windows"
        ]
    )

    # Arrows from Top 3 into Decision Node
    draw_arrow(t1_x + top_w // 2, top_y + top_h, dec_x + 80, dec_y)
    draw_arrow(t2_x + top_w // 2, top_y + top_h, dec_x + dec_w // 2, dec_y)
    draw_arrow(t3_x + top_w // 2, top_y + top_h, dec_x + dec_w - 80, dec_y)

    # Bottom Terminal: Role-Based Portals & Verifier
    bot_x = p3_x + 100
    bot_y = 760
    bot_w = 820
    bot_h = 240
    draw_node(
        bot_x, bot_y, bot_w, bot_h,
        icon_type='vault_safe',
        title="5-Role Portals & In-Browser Offline Verifier",
        subtitle="Role-Tailored Workspaces & Tamper-Proof Cryptographic Verification",
        bullets=[
            "AICTE National HQ: Strategic surveillance, state parity, and exception decisions",
            "Institution Workspace: Real-time seat ledger, upload wizard, and student registry",
            "Student Portal: Single window APAAR tracking, Confirm/Dispute, and signed PDF certificates",
            "Credential Verifier: In-browser TweetNaCl Ed25519 QR scanning with zero server inquiries",
            "Audit Console: Recomputes SHA-256 Merkle chain to mathematically prove zero tampering"
        ]
    )

    # Arrow from Decision to Portals
    draw_arrow(dec_x + dec_w // 2, dec_y + dec_h, bot_x + bot_w // 2, bot_y)

    # Bottom Architecture Metrics Banner
    draw.rounded_rectangle([80, 1140, 2320, 1260], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    stat_font = ImageFont.truetype('arialbd.ttf', 22)
    stat_sub_font = ImageFont.truetype('arial.ttf', 16)

    metrics = [
        ("⚡ 100% Real-Time Parity", "Zero intake overruns & quota bleeding across pools"),
        ("🛡️ DPDP Act 2023 Compliant", "Cryptographic Bloom filter blind matching (0% PII leak)"),
        ("📜 SHA-256 Merkle Chain", "Mathematically tamper-evident audit ledger verification"),
        ("📊 Benchmark Validated", "Tested on 241 institutions & 3,500+ records with zero lag")
    ]
    stat_x = 130
    for title, desc in metrics:
        draw.text((stat_x, 1165), title, fill=navy_ink, font=stat_font)
        draw.text((stat_x, 1205), desc, fill=slate_sub, font=stat_sub_font)
        stat_x += 560

    out_paths = [
        "vidhya_setu_system_architecture.png",
        os.path.join("frontend", "public", "vidhya_setu_system_architecture.png"),
        r"C:\Users\vinuj\.gemini\antigravity\brain\ab914751-9c91-45cc-ad2b-4b2cddb829db\vidhya_setu_system_architecture.png"
    ]
    for p in out_paths:
        os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
        img.save(p, quality=95)
        print(f"Saved system architecture diagram to: {p}")

generate_system_architecture()

