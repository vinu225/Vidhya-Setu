import os
from PIL import Image, ImageDraw, ImageFont

def generate_thumbnail():
    w, h = 1920, 1080  # 16:9 Full HD YouTube Thumbnail
    img = Image.new('RGB', (w, h), (11, 19, 43))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(h):
        r = int(10 + (25 - 10) * (y / h))
        g = int(18 + (35 - 18) * (y / h))
        b = int(40 + (65 - 40) * (y / h))
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Decorative tech grid dots
    for gx in range(60, w, 60):
        for gy in range(60, h, 60):
            draw.point((gx, gy), fill=(30, 58, 138))

    # Fonts
    tag_font = ImageFont.truetype('arialbd.ttf', 24)
    huge_title_font = ImageFont.truetype('arialbd.ttf', 96)
    sub_title_font = ImageFont.truetype('arialbd.ttf', 44)
    body_font = ImageFont.truetype('arialbd.ttf', 24)
    stat_val_font = ImageFont.truetype('arialbd.ttf', 38)
    stat_lbl_font = ImageFont.truetype('arial.ttf', 18)
    card_title_font = ImageFont.truetype('arialbd.ttf', 22)
    card_text_font = ImageFont.truetype('arial.ttf', 16)

    # 1. Top SIH Category Pill
    tag_text = "⚡ SMART INDIA HACKATHON 2024  •  PROBLEM STATEMENT 26263"
    tag_w = draw.textlength(tag_text, font=tag_font) + 40
    draw.rounded_rectangle([100, 110, 100 + tag_w, 165], radius=28, fill=(245, 158, 11))
    draw.text((120, 122), tag_text, fill=(15, 23, 42), font=tag_font)

    # 2. Main Title
    draw.text((100, 200), "VIDHYA SETU", fill=(255, 255, 255), font=huge_title_font)

    # 3. Punchy Colored Subtitle
    draw.text((100, 315), "AI SEAT PARITY & APAAR VERIFIER", fill=(56, 189, 248), font=sub_title_font)
    draw.text((100, 375), "Real-Time National Regulatory Surveillance Platform for AICTE", fill=(203, 213, 225), font=tag_font)

    # 4. Feature Badges (Left Column)
    features = [
        ("⚡ Real-Time Intake Parity", "Stops over-intake breaches instantly across Regular, TFW & NRI pools"),
        ("🛡️ DPDP Act 2023 Compliant", "Cryptographic Bloom filter blind matching with 0% personal data leakage"),
        ("🔍 Zero-Server Offline QR", "Browser-based TweetNaCl Ed25519 verification without central tracking"),
        ("📜 SHA-256 Merkle Ledger", "Mathematically tamper-evident audit ledger proving zero DB alteration")
    ]

    fy = 450
    for f_title, f_sub in features:
        # Icon circle
        draw.ellipse([100, fy + 4, 136, fy + 40], fill=(16, 185, 129))
        draw.text((108, fy + 9), "✓", fill=(255, 255, 255), font=tag_font)
        draw.text((150, fy), f_title, fill=(255, 255, 255), font=body_font)
        draw.text((150, fy + 30), f_sub, fill=(148, 163, 184), font=card_text_font)
        fy += 76

    # 5. Right Side Visual Hero Mockups
    # Container Box for Visuals
    cx, cy, cw, ch = 1080, 140, 740, 780
    draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=24, fill=(15, 23, 42), outline=(37, 99, 235), width=3)

    # Top Header inside Hero Box
    draw.rounded_rectangle([cx, cy, cx + cw, cy + 60], radius=24, fill=(30, 41, 59))
    draw.text((cx + 25, cy + 18), "🏛️ AICTE NATIONAL SURVEILLANCE COMMAND COCKPIT", fill=(255, 255, 255), font=card_title_font)

    # Card 1: India Surveillance Map Card inside
    m_x, m_y, m_w, m_h = cx + 30, cy + 85, 330, 340
    draw.rounded_rectangle([m_x, m_y, m_x + m_w, m_y + m_h], radius=16, fill=(24, 33, 56), outline=(51, 65, 85), width=2)
    draw.text((m_x + 16, m_y + 14), "Geo-Spatial Intake Map", fill=(255, 255, 255), font=card_title_font)
    draw.text((m_x + 16, m_y + 44), "Real-time state parity utilization", fill=(148, 163, 184), font=card_text_font)

    # Visual map preview with colored state pills
    states = [
        ("Rajasthan", "104%", (239, 68, 68), "BREACH"),
        ("Madhya Pradesh", "102%", (239, 68, 68), "BREACH"),
        ("Uttar Pradesh", "98%", (245, 158, 11), "WARNING"),
        ("Maharashtra", "84%", (59, 130, 246), "HEALTHY"),
        ("Karnataka", "79%", (59, 130, 246), "HEALTHY"),
        ("Kerala", "71%", (16, 185, 129), "SUB-CAP")
    ]
    sy = m_y + 80
    for st_name, pct, col, st_lbl in states:
        draw.text((m_x + 20, sy), st_name, fill=(255, 255, 255), font=card_text_font)
        draw.rounded_rectangle([m_x + 180, sy - 2, m_x + 235, sy + 20], radius=6, fill=col)
        draw.text((m_x + 188, sy), pct, fill=(255, 255, 255), font=ImageFont.truetype('arialbd.ttf', 13))
        draw.text((m_x + 248, sy), st_lbl, fill=col, font=ImageFont.truetype('arialbd.ttf', 12))
        sy += 38

    # Card 2: Student Verifiable Sovereign ID Card
    v_x, v_y, v_w, v_h = cx + 380, cy + 85, 330, 340
    draw.rounded_rectangle([v_x, v_y, v_x + v_w, v_y + v_h], radius=16, fill=(24, 33, 56), outline=(16, 185, 129), width=2)
    draw.text((v_x + 16, v_y + 14), "Sovereign APAAR Wallet", fill=(255, 255, 255), font=card_title_font)
    draw.text((v_x + 16, v_y + 44), "Ed25519 Verifiable Credential", fill=(148, 163, 184), font=card_text_font)

    # QR Code placeholder box
    qr_x, qr_y = v_x + 20, v_y + 80
    draw.rounded_rectangle([qr_x, qr_y, qr_x + 110, qr_y + 110], radius=8, fill=(255, 255, 255))
    # Simulated QR patterns
    draw.rectangle([qr_x + 10, qr_y + 10, qr_x + 35, qr_y + 35], fill=(15, 23, 42))
    draw.rectangle([qr_x + 75, qr_y + 10, qr_x + 100, qr_y + 35], fill=(15, 23, 42))
    draw.rectangle([qr_x + 10, qr_y + 75, qr_x + 35, qr_y + 100], fill=(15, 23, 42))
    draw.rectangle([qr_x + 50, qr_y + 50, qr_x + 65, qr_y + 65], fill=(15, 23, 42))

    draw.text((v_x + 145, v_y + 85), "Candidate:", fill=(148, 163, 184), font=card_text_font)
    draw.text((v_x + 145, v_y + 105), "Rahul Sharma", fill=(255, 255, 255), font=card_title_font)
    draw.text((v_x + 145, v_y + 140), "APAAR ID:", fill=(148, 163, 184), font=card_text_font)
    draw.text((v_x + 145, v_y + 160), "•••• •••• 1234", fill=(56, 189, 248), font=card_title_font)

    draw.rounded_rectangle([v_x + 20, v_y + 215, v_x + 310, v_y + 265], radius=10, fill=(16, 185, 129))
    draw.text((v_x + 35, v_y + 228), "✓ VERIFIED AUTHENTIC · AICTE", fill=(255, 255, 255), font=ImageFont.truetype('arialbd.ttf', 16))
    draw.text((v_x + 25, v_y + 285), "Seal: e4d9b28a1c7f5e3049b1 (Valid)", fill=(148, 163, 184), font=ImageFont.truetype('arial.ttf', 14))

    # Bottom Stat Callout inside Hero Box
    bx, by, bw, bh = cx + 30, cy + 450, 680, 290
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=16, fill=(30, 58, 138), outline=(59, 130, 246), width=2)
    draw.text((bx + 25, by + 20), "🏆 VALIDATED AT NATIONAL SCALE", fill=(245, 158, 11), font=card_title_font)

    # 3 Stat Columns
    c_stats = [
        ("241", "Institutions Tested", "Premier & Synthetic Nodes"),
        ("3,500+", "Student Records", "Fully Seeded & Verified"),
        ("0 ms", "Offline Verification", "TweetNaCl Ed25519 Engine")
    ]
    st_x = bx + 25
    for num, lbl1, lbl2 in c_stats:
        draw.text((st_x, by + 65), num, fill=(255, 255, 255), font=huge_title_font)
        draw.text((st_x, by + 180), lbl1, fill=(248, 250, 252), font=body_font)
        draw.text((st_x, by + 215), lbl2, fill=(191, 219, 254), font=card_text_font)
        st_x += 230

    # 6. Bottom Banner / Footer
    draw.line([(100, 960), (w - 100, 960)], fill=(30, 58, 138), width=2)
    draw.text((100, 990), "🚀 Team Vidhya Setu  •  AICTE Approval Process Handbook (APH) Statutory Parity  •  NEP 2020 Compliant", fill=(148, 163, 184), font=body_font)

    # Save to multiple locations
    out_paths = [
        "vidhya_setu_youtube_thumbnail.png",
        os.path.join("frontend", "public", "vidhya_setu_youtube_thumbnail.png"),
        r"C:\Users\vinuj\.gemini\antigravity\brain\ab914751-9c91-45cc-ad2b-4b2cddb829db\vidhya_setu_youtube_thumbnail.png"
    ]
    for p in out_paths:
        os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
        img.save(p, quality=95)
        print(f"Saved thumbnail to: {p}")

generate_thumbnail()

