# P2: Metrics Sheet Setup Guide

This document provides formulas for the "Metrics" sheet tab in your Speaking Opportunities Google Sheet. Add a new tab named **Metrics** and paste these formulas into the cells indicated.

---

## Setup Instructions

1. Open your Google Sheet (Opportunities pipeline)
2. Add a new sheet tab: **Metrics**
3. Create the following layout and paste the formulas below

---

## Sheet Layout

| Cell | Label | Formula |
|------|-------|---------|
| A1 | **Speaking Pipeline Metrics** | (header) |
| A2 | Last Updated | `=NOW()` |
| A4 | **Pipeline Metrics** | (header) |
| A5 | Total opportunities discovered | See below |
| A6 | By source: Conference | See below |
| A7 | By source: University | See below |
| A8 | By source: Podcast | See below |
| A9 | By source: Association | See below |
| A11 | **By Status** | (header) |
| A12 | New / Needs Enrichment | See below |
| A13 | Qualified / High Priority | See below |
| A14 | Contacted | See below |
| A15 | Interested | See below |
| A16 | Declined | See below |
| A17 | Booked | See below |
| A18 | No Response | See below |
| A20 | **Performance Metrics** | (header) |
| A21 | Response rate | See below |
| A22 | Conversion rate (Booked/Contacted) | See below |
| A23 | Average quality score | See below |
| A24 | Pitches sent this week | See below |
| A25 | Follow-ups sent this week | See below |
| A26 | New opportunities this week | See below |

---

## Formulas

**Assumptions:** Opportunities data is in sheet "Opportunities", columns A–AA. Adjust sheet name if different.

### Pipeline Metrics

| Cell | Formula |
|------|---------|
| B5 | `=COUNTA(Opportunities!A2:A)` |
| B6 | `=COUNTIF(Opportunities!B:B,"conference")` |
| B7 | `=COUNTIF(Opportunities!B:B,"university")` |
| B8 | `=COUNTIF(Opportunities!B:B,"podcast")` |
| B9 | `=COUNTIF(Opportunities!B:B,"association")` |

### By Status

| Cell | Formula |
|------|---------|
| B12 | `=COUNTIF(Opportunities!Q:Q,"*Needs Enrichment*")+COUNTIF(Opportunities!Q:Q,"*New*")` |
| B13 | `=COUNTIF(Opportunities!Q:Q,"*Qualified*")+COUNTIF(Opportunities!Q:Q,"*High Priority*")` |
| B14 | `=COUNTIF(Opportunities!Q:Q,"Contacted")` |
| B15 | `=COUNTIF(Opportunities!Q:Q,"Interested")` |
| B16 | `=COUNTIF(Opportunities!Q:Q,"Declined")` |
| B17 | `=COUNTIF(Opportunities!Q:Q,"*Booked*")` |
| B18 | `=COUNTIF(Opportunities!Q:Q,"No Response")` |

### Performance Metrics

| Cell | Formula |
|------|---------|
| B21 | `=IF(B14=0,"N/A",ROUND((B15+B16)/B14*100,1)&"%")` |
| B22 | `=IF(B14=0,"N/A",ROUND(B17/B14*100,1)&"%")` |
| B23 | `=IF(COUNTA(Opportunities!P:P)<=1,"N/A",ROUND(AVERAGE(FILTER(Opportunities!P2:P,ISNUMBER(Opportunities!P2:P))),1))` |

### Activity Metrics (This Week)

| Cell | Formula |
|------|---------|
| B24 | `=COUNTIFS(Opportunities!R:R,">="&(TODAY()-WEEKDAY(TODAY(),2)),Opportunities!Q:Q,"Contacted")` |
| B25 | `=IFERROR(COUNTIFS('Follow-Up Log'!C:C,">="&(TODAY()-WEEKDAY(TODAY(),2))),0)` |
| B26 | `=COUNTIFS(Opportunities!S:S,">="&(TODAY()-WEEKDAY(TODAY(),2)))` |

---

## Alternative: Simpler Activity Formulas

If the activity formulas above don't work (e.g., different date column layout), use:

| Metric | Alternative Formula |
|--------|---------------------|
| Pitches sent this week | `=COUNTIFS(Opportunities!R:R,">="&TODAY()-7,Opportunities!R:R,"<>")` |
| New opportunities this week | `=COUNTIFS(Opportunities!S:S,">="&TODAY()-7)` |

---

## Notes

- **Error handling:** Formulas use `IF`, `IFERROR` where needed to handle empty data
- **Column references:** Adjust column letters if your Opportunities sheet structure differs (P=score, Q=status, R=contacted_date, S=last_activity)
- **Follow-Up Log:** Workflow 11 writes to "Follow-Up Log" sheet; create it if missing
- **Auto-refresh:** `=NOW()` in A2 updates on sheet open/edit; use `Ctrl+Shift+F9` (Windows) or `Cmd+Shift+F9` (Mac) to force recalc

---

## Optional: Time to Response

If you track `responded_date` (column AA) and `contacted_date` (column R):

| Cell | Label | Formula |
|------|-------|---------|
| B27 | Avg days to response | `=IFERROR(AVERAGE(ARRAYFORMULA(IF(Opportunities!AA:AA<>"",DAYS(Opportunities!AA:AA,Opportunities!R:R),""))),"N/A")` |

---

*Generated for Speaking Business Automation P2 Reporting Foundation*
