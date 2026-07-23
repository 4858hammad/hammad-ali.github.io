#!/usr/bin/env python3
"""Generate an ATS-safe CV from portfolio_data.yaml.

The designed CV (assets/cv_source.html) uses a two-column table with a flex
row-head that right-aligns dates. It prints beautifully, but Chrome's PDF text
layer does not always emit the flex date box in DOM order, so extraction
detaches dates from their employer -- the education date lands 30 lines away
from the degree. An ATS reading that will mis-assign or drop employment dates.

This file emits a strictly single-column document:
  - no tables, no flex, no floats, no columns
  - dates inline in the same text run as the employer
  - standard section headings an ATS recognises
  - no icon glyphs, standard fonts, real bullet characters

Run:  python3 build_ats_cv.py
Then: google-chrome --headless --no-pdf-header-footer \
        --print-to-pdf=assets/Hammad-Ali-CV-ATS.pdf file://$PWD/assets/cv_ats_source.html
"""
import html
import pathlib

import yaml

ROOT = pathlib.Path(__file__).parent
DATA = yaml.safe_load((ROOT / "portfolio_data.yaml").read_text(encoding="utf-8"))

STUDENT_CLIENTS = {"University Project", "Personal Project"}

# Roles are merged by company so one tenure reads as one tenure. Order matters.
MERGE = {"Aetos Technologies": "Jan 2025 - Apr 2026"}

EDUCATION = [
    ("Lahore Garrison University", "BS Computer Science", "Jul 2019 - Jul 2023"),
]
CERTIFICATIONS = [
    ("Business Development, Lahore Garrison University", "Jan 2023 - Jul 2023"),
    ("Docker Training Course for Absolute Beginners, KodeKloud", "2024"),
]


def e(v):
    return html.escape(str(v))


def experience_html():
    out, seen = [], set()
    exps = DATA["experience"]
    for i, exp in enumerate(exps):
        company = exp["company"]
        if company in MERGE:
            if company in seen:
                continue
            seen.add(company)
            out.append(f'<p class="job"><strong>{e(company)}</strong>, {e(MERGE[company])}</p>')
            for sub in [x for x in exps if x["company"] == company]:
                out.append(f'<p class="role">{e(sub["role"])}, {e(sub["period"])}</p>')
                out.append("<ul>")
                out += [f"<li>{e(h)}</li>" for h in sub.get("highlights", [])]
                out.append("</ul>")
        else:
            out.append(
                f'<p class="job"><strong>{e(company)}</strong>, {e(exp["period"])}</p>'
            )
            out.append(f'<p class="role">{e(exp["role"])}</p>')
            out.append("<ul>")
            out += [f"<li>{e(h)}</li>" for h in exp.get("highlights", [])]
            out.append("</ul>")
    return "\n".join(out)


def projects_html():
    out = []
    for p in DATA["projects"]:
        if p["client"] in STUDENT_CLIENTS:
            continue
        stack = ", ".join(p.get("tech_stack", []))
        mods = ", ".join(p.get("modules", []))
        meta = " | ".join(x for x in [f"Modules: {mods}" if mods else "", stack] if x)
        out.append(
            f'<p class="proj"><strong>{e(p["title"])}</strong> — '
            f'{e(p["client"])}, {e(p["year"])}<br>'
            f'<span class="meta">{e(meta)}</span><br>'
            f'{e(p.get("full_desc") or p.get("short_desc", ""))}</p>'
        )
    out.append(
        '<p class="proj"><strong>University and personal projects</strong> — 2022<br>'
        '<span class="meta">Kotlin, React Native, Django, Firebase, .NET MVC</span><br>'
        "Android and cross-platform mobile apps (Showroom Ecommerce, PavoBixbox, "
        "Idea Pitching) with Firebase sync and authentication, plus a .NET MVC web "
        "CV builder.</p>"
    )
    return "\n".join(out)


def skills_html():
    return "\n".join(
        f'<p class="skill"><strong>{e(g["category"])}:</strong> {e(", ".join(g["items"]))}</p>'
        for g in DATA["skills"]
    )


contact = DATA["contact"]
site = DATA["site"]
client_count = sum(1 for p in DATA["projects"] if p["client"] not in STUDENT_CLIENTS)

SUMMARY = (
    f"Odoo ERP developer with 3+ years delivering production ERP systems across "
    f"Odoo 16, 17, 18 and 19 in both Community and Enterprise environments. "
    f"Specialised in custom module development, third-party integrations (payment "
    f"gateways, accounting systems, REST APIs) and version migrations, with OWL "
    f"front-end work on Odoo 18 Enterprise. Delivered {client_count} client projects "
    f"across manufacturing, laboratory, clinical and e-commerce sectors, and led a "
    f"3-engineer Odoo team through client delivery and production releases."
)

RESULTS = [
    "500+ payment transactions per month automated via a custom Mastercard provider",
    "Manual accounting data entry eliminated entirely through Sage to Odoo sync",
    "40% reduction in sales order follow-up time via lifecycle automation",
    "25% faster page load after ORM and query optimisation",
    "Zero data loss across a full HR module migration from Odoo 16 to 17",
]

DOC = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hammad Ali — Odoo ERP Developer CV</title>
<style>
  @page {{ size: A4; margin: 14mm; }}
  body {{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.30;
    color: #000;
    margin: 0;
  }}
  h1 {{ font-size: 16pt; margin: 0 0 2px 0; }}
  h2 {{
    font-size: 11pt;
    margin: 12px 0 4px 0;
    border-bottom: 1px solid #000;
    padding-bottom: 1px;
  }}
  p {{ margin: 0 0 3px 0; }}
  ul {{ margin: 2px 0 6px 0; padding-left: 18px; }}
  li {{ margin: 0 0 1px 0; }}
  .job {{ margin-top: 7px; }}
  .role {{ font-style: italic; }}
  .proj {{ margin-bottom: 6px; }}
  .meta {{ font-size: 9pt; color: #333; }}
  .skill {{ margin-bottom: 2px; }}
</style>
</head>
<body>

<h1>Hammad Ali</h1>
<p>Odoo ERP Developer and Python Consultant</p>
<p>{e(contact['location'])} | Phone: {e(contact['phone'])} | Email: {e(contact['email'])}</p>
<p>LinkedIn: {e(contact['linkedin'].replace('https://', ''))} | GitHub: {e(contact['github'].replace('https://', ''))} | Portfolio: {e(site['url'].replace('https://', ''))}</p>

<h2>Professional Summary</h2>
<p>{e(SUMMARY)}</p>

<h2>Key Achievements</h2>
<ul>
{chr(10).join(f'<li>{e(r)}</li>' for r in RESULTS)}
</ul>

<h2>Technical Skills</h2>
{skills_html()}

<h2>Work Experience</h2>
{experience_html()}

<h2>Education</h2>
{chr(10).join(f'<p><strong>{e(s)}</strong>, {e(d)}<br>{e(deg)}</p>' for s, deg, d in EDUCATION)}

<h2>Certifications</h2>
{chr(10).join(f'<p>{e(n)}, {e(d)}</p>' for n, d in CERTIFICATIONS)}

<h2>Projects</h2>
{projects_html()}

<h2>Languages</h2>
<p>English, Urdu</p>

</body>
</html>
"""

out = ROOT / "assets" / "cv_ats_source.html"
out.write_text(DOC, encoding="utf-8")
print(f"wrote {out} ({client_count} client projects)")
