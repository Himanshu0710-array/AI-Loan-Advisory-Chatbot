from pathlib import Path

# Try importing or install reportlab
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors

doc_path = Path("documents/Sample_Loan_Policy_2026.pdf")
doc_path.parent.mkdir(exist_ok=True)

doc = SimpleDocTemplate(str(doc_path), pagesize=letter)
styles = getSampleStyleSheet()
story = []

title_style = styles['Heading1']
title_style.textColor = colors.HexColor('#1A365D')

h2_style = styles['Heading2']
h2_style.textColor = colors.HexColor('#2B6CB0')

body = styles['BodyText']
body.fontSize = 10
body.leading = 15

story.append(Paragraph('LMS BANK LOAN POLICY & GUIDELINES (2026)', title_style))
story.append(Spacer(1, 15))

story.append(Paragraph('1. HOME LOAN ELIGIBILITY CRITERIA & RULES', h2_style))
story.append(Spacer(1, 8))
story.append(Paragraph(
    'To be eligible for an LMS Bank Home Loan, applicants must meet the following mandatory criteria:<br/>'
    '• <b>Age:</b> Minimum 21 years at the time of application and maximum 65 years at the end of the loan tenure.<br/>'
    '• <b>Income:</b> Minimum net monthly salary of Rs. 35,000 for salaried individuals, or Rs. 5,00,000 annual net income for self-employed professionals.<br/>'
    '• <b>Credit Score (CIBIL):</b> A credit score of 750 or above is required for standard interest rates. Applicants with scores between 700 and 749 are eligible but will incur a 0.5% interest rate surcharge.<br/>'
    '• <b>Maximum Loan-to-Value (LTV) Ratio:</b> Up to 90% of property value for loans up to Rs. 30 Lakhs; up to 80% for loans above Rs. 30 Lakhs and up to Rs. 75 Lakhs.',
    body
))
story.append(Spacer(1, 15))

story.append(Paragraph('2. INTEREST RATES & TENURE', h2_style))
story.append(Spacer(1, 8))
story.append(Paragraph(
    '• <b>Home Loan Interest Rate:</b> Starting from 8.50% p.a. to 9.75% p.a. (floating rate based on credit score). Maximum tenure is 30 years (360 months).<br/>'
    '• <b>Personal Loan Interest Rate:</b> Starting from 10.75% p.a. to 14.50% p.a. Maximum tenure is 5 years (60 months).<br/>'
    '• <b>Processing Fees:</b> 0.5% of the loan amount plus applicable GST for Home Loans, and 1.0% for Personal Loans.',
    body
))
story.append(Spacer(1, 15))

story.append(Paragraph('3. EMI CALCULATION FORMULA & EXAMPLES', h2_style))
story.append(Spacer(1, 8))
story.append(Paragraph(
    'The Equated Monthly Installment (EMI) is calculated using the standard mathematical formula:<br/>'
    '<b>EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]</b><br/>'
    'Where:<br/>'
    '• P = Principal Loan Amount<br/>'
    '• R = Monthly Interest Rate (Annual Rate / 12 / 100)<br/>'
    '• N = Loan Tenure in Months<br/><br/>'
    '<b>Calculation Example (Personal Loan):</b><br/>'
    'If an applicant takes a Personal Loan of Rs. 5,00,000 (P) at an annual interest rate of 12% p.a. for a tenure of 3 years (N = 36 months):<br/>'
    '• Monthly Interest Rate (R) = 12 / 12 / 100 = 0.01<br/>'
    '• EMI = [5,00,000 x 0.01 x (1.01)^36] / [(1.01)^36 - 1] = Rs. 16,607 per month.<br/>'
    'Total repayment over 3 years will be Rs. 5,97,858 (Total Interest payable = Rs. 97,858).',
    body
))
story.append(Spacer(1, 15))

story.append(Paragraph('4. REQUIRED DOCUMENTATION FOR LOAN APPLICATION', h2_style))
story.append(Spacer(1, 8))
story.append(Paragraph(
    'Applicants must submit the following documents along with their application form:<br/>'
    '1. <b>Identity Proof:</b> PAN Card (Mandatory), Aadhaar Card, or Passport.<br/>'
    '2. <b>Address Proof:</b> Aadhaar Card, Voter ID, or Utility Bill (not older than 3 months).<br/>'
    '3. <b>Income Proof (Salaried):</b> Last 3 months pay slips, last 6 months bank statement showing salary credits, and Form 16 for the last 2 years.<br/>'
    '4. <b>Income Proof (Self-Employed):</b> ITR for the last 3 financial years, computation of income, and balance sheet certified by a Chartered Accountant.<br/>'
    '5. <b>Property Documents (For Home Loan):</b> Agreement to Sale, Title Deed, Approved Building Plan, and NOC from Builder/Society.',
    body
))
story.append(Spacer(1, 15))

story.append(Paragraph('5. PREPAYMENT & FORECLOSURE RULES', h2_style))
story.append(Spacer(1, 8))
story.append(Paragraph(
    '• <b>Floating Rate Home Loans:</b> ZERO prepayment penalty or foreclosure charges as per RBI guidelines.<br/>'
    '• <b>Fixed Rate & Personal Loans:</b> Foreclosure is permitted only after completing 6 EMIs. A foreclosure charge of 3% plus GST on the outstanding principal balance will apply.',
    body
))

doc.build(story)
print(f"[+] Sample PDF created successfully at: {doc_path.resolve()}")
