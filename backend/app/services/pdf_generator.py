from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def generate_cv_pdf(cv):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)

    width, height = letter
    y = height - 50

    def write_block(title, content):
        nonlocal y
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(50, y, title)
        y -= 20

        pdf.setFont("Helvetica", 10)
        text_object = pdf.beginText(50, y)

        for line in str(content).split("\n"):
            text_object.textLine(line)
            y -= 14
            if y < 80:
                pdf.drawText(text_object)
                pdf.showPage()
                y = height - 50
                pdf.setFont("Helvetica", 10)
                text_object = pdf.beginText(50, y)

        pdf.drawText(text_object)
        y -= 20

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(50, y, "Generated CV")
    y -= 30

    pdf.setFont("Helvetica", 10)
    pdf.drawString(50, y, f"ATS Score: {cv.ats_score}%")
    y -= 30

    write_block("Summary", cv.cv_summary)
    write_block("Skills", cv.cv_skills)
    write_block("Experience", cv.cv_experience)
    if getattr(cv, "cover_letter", None):
        write_block("Cover Letter Draft", cv.cover_letter)
    if getattr(cv, "interview_questions", None):
        write_block("Interview Prep Questions", cv.interview_questions)
    if getattr(cv, "improvement_suggestions", None):
        write_block("Improvement Suggestions", cv.improvement_suggestions)
    write_block("Missing Keywords", cv.missing_keywords or "None")

    pdf.save()
    buffer.seek(0)
    return buffer
