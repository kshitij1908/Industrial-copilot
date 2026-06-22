import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


def create_sop_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0ea5e9"),
        spaceAfter=12,
    )

    h2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6,
    )

    story = []

    # Title
    story.append(Paragraph("Standard Operating Procedure: Centrifugal Pump P-101", title_style))
    story.append(Paragraph("Document Ref: SOP-OPS-P101-01 | Classification: Restrictive", body_style))
    story.append(Spacer(1, 12))

    # Section 1
    story.append(Paragraph("1. Pre-Start Inspections", h2_style))
    story.append(
        Paragraph(
            "Before executing a startup command for the P-101 main suction pump, operators must verify the following pre-start checks:",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- Check lubrication oil levels in the main bearing housing. Level must be between 50% and 75% on the sight glass indicator.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- Confirm that the suction gate valve V-101A is fully open. WARNING: Running the pump with a closed suction line will cause dry-run cavitation.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- Inspect the mechanical seals for any visible leakage. A drip rate exceeding 10 drops per minute requires seal inspection.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- Ensure cooling water flow is active to the seal flush line with a minimum flow rate of 2.5 GPM.",
            body_style,
        )
    )
    story.append(Spacer(1, 10))

    # Section 2
    story.append(Paragraph("2. Startup Sequence", h2_style))
    story.append(Paragraph("Follow these sequential steps to safely start Pump P-101:", body_style))
    story.append(
        Paragraph(
            "Step 1: Rotate the pump shaft manually by hand to ensure the impeller is free of obstructions.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "Step 2: Fully close the discharge globe valve V-102B. (Starting centrifugal pumps against a closed valve reduces current surge load).",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "Step 3: Turn on the main electrical isolator panel switch in MCC-01 cabinet.",
            body_style,
        )
    )
    story.append(
        Paragraph("Step 4: Press the START button on the local control interface panel.", body_style)
    )
    story.append(
        Paragraph(
            "Step 5: Monitor the motor current draw. The startup peak current should drop to the normal operating load of 45 Amps within 3 seconds.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "Step 6: Slowly crack open the discharge valve V-102B until the system pressure stabilizes at 6.2 bar operating pressure.",
            body_style,
        )
    )
    story.append(Spacer(1, 10))

    # Section 3
    story.append(Paragraph("3. Operational Specifications", h2_style))
    data = [
        ["Parameter", "Normal Value", "Trip Limit"],
        ["Discharge Pressure", "6.2 bar", "7.5 bar"],
        ["Motor Temperature", "65 C", "85 C"],
        ["Vibration Velocity", "2.8 mm/s", "4.5 mm/s"],
        ["Flow Rate", "120 GPM", "150 GPM"],
    ]
    t = Table(data, colWidths=[150, 150, 150])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
            ]
        )
    )
    story.append(t)
    story.append(Spacer(1, 10))

    # Section 4 (Safety)
    story.append(Paragraph("4. Health & Safety Compliance", h2_style))
    story.append(
        Paragraph(
            "This equipment processes hazardous hydrocarbons. Lockout/Tagout (LOTO) procedures must be enforced prior to any intervention. Minimum required PPE includes hard hat, steel-toed boots, protective safety goggles, and anti-static overalls.",
            body_style,
        )
    )

    doc.build(story)


def create_rca_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#dc2626"),
        spaceAfter=12,
    )

    h2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6,
    )

    story = []

    # Title
    story.append(Paragraph("Failure Incident Report & RCA: Main Pump P-101", title_style))
    story.append(
        Paragraph("Investigation Date: May 14, 2026 | Inspector: Reliability Eng. Team", body_style)
    )
    story.append(Spacer(1, 12))

    # Section 1
    story.append(Paragraph("1. Incident Summary", h2_style))
    story.append(
        Paragraph(
            "On May 12, 2026, the main centrifugal feed pump P-101 tripped on bearing high-temperature limit (reaching 92 C). Operators reported loud metallic rattling and excessive discharge pressure fluctuations before the automatic trip. Flow rate had degraded to 40 GPM from the standard 120 GPM.",
            body_style,
        )
    )
    story.append(Spacer(1, 10))

    # Section 2
    story.append(Paragraph("2. Failure Analysis & Findings", h2_style))
    story.append(
        Paragraph("Post-incident inspection revealed the following physical details:", body_style)
    )
    story.append(
        Paragraph(
            "- Severe cavitation pitting was observed on the leading edges of the main impeller blades.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- The suction strainer S-101 was found completely clogged with paraffin debris and rust flakes from the tank lining, restricting incoming flow.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- High vibration levels (measured at 6.8 mm/s velocity) caused mechanical seal face misalignment, leading to leakage.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- The bearing oil level was found below 10%, indicating lubricant starvation which led to extreme friction heating.",
            body_style,
        )
    )
    story.append(Spacer(1, 10))

    # Section 3
    story.append(Paragraph("3. Root Cause Identification", h2_style))
    story.append(
        Paragraph(
            "Primary Root Cause: Impeller cavitation caused by suction line fluid starvation, which originated from a clogged strainer. The bearing overheating was caused by bearing lubricant starvation due to missed lubrication cycles.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "Contributing Factors: Lack of vibration transmitters, lack of automatic differential pressure alerts across strainer S-101, and manual lubrication routes not followed for two consecutive weeks.",
            body_style,
        )
    )
    story.append(Spacer(1, 10))

    # Section 4
    story.append(Paragraph("4. Recommended Corrective Actions", h2_style))
    story.append(
        Paragraph(
            "- Clean suction strainer S-101 and implement a bi-weekly preventive cleaning schedule.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- Replace the damaged impeller blades and the mechanical seal face assembly.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- Install a digital differential pressure transmitter (DPT-101) across the strainer to alert control room of clog conditions.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "- Revise and audit the manual lubrication route schedules to ensure bearing grease is topped up every 100 operating hours.",
            body_style,
        )
    )

    doc.build(story)


if __name__ == "__main__":
    os.makedirs("../docs", exist_ok=True)
    create_sop_pdf("../docs/P-101_Startup_SOP.pdf")
    create_rca_pdf("../docs/P-101_Failure_RCA_Report.pdf")
    print("Generated sample documents successfully!")
