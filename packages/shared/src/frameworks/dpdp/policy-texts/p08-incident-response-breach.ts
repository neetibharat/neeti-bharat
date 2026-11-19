// Incident Response and Breach Notification Policy, as counsel wrote it.
export const P08_TEXT = `> On becoming aware of a personal data breach, {{companyName}} informs the Data Protection Board and each affected Data Principal without delay, and files a detailed report with the Board within the breach reporting window ({{breachReportWindow}}).

## 1. Purpose

To detect, contain and recover from security incidents, and to meet the breach intimation duties in s.8(6) and Rule 7.

## 2. Scope

Any actual or suspected unauthorised processing, accidental disclosure, acquisition, sharing, use, alteration, destruction or loss of access to personal data, which compromises its confidentiality, integrity or availability, in {{companyName}} systems or at a {{companyName}} processor.

## 3. Incident response plan

{{companyName}} keeps an approved incident response plan, reviewed each year, that sets roles, severity levels, escalation paths, and a current on-call and escalation contact list with {{breachContact}} as the first point of contact.

## 4. Response steps

1. **Report.** Anyone who suspects an incident reports it at once to the breach contact, {{breachContact}}, or to the DPO, {{dpoName}} at {{dpoEmail}}. Do not investigate alone or delete evidence.
2. **Triage.** The Security lead logs the incident in the incident register (with discovery, containment and notification timestamps), assigns severity, and decides whether personal data is involved. If yes, the DPO is engaged and the awareness time is recorded; the Board reporting window runs from that time. The Security lead decides at triage whether a CERT-In report is due.
3. **Contain.** Isolate affected systems, revoke credentials, block exfiltration, preserve logs and forensic images.
4. **Assess.** Determine nature, extent, timing and location of the breach, data categories and number of Data Principals affected, and likely consequences.
5. **Notify** as set out in section 5.
6. **Eradicate and recover** under P07.
7. **Post-incident review** for every significant incident: root cause, lessons, control changes, owners and dates.

## 5. Notifications under Rule 7

**To each affected Data Principal, without delay,** in clear plain language and in the language they used with {{companyName}} ({{languagesOffered}} or another Eighth Schedule language offered), through their user account or registered contact:

- a description of the breach (nature, extent, timing and location);
- likely consequences relevant to them;
- measures taken or being taken to mitigate risk;
- safety measures they can take to protect their interests;
- business contact details of a person who can answer their questions: {{dpoName}}, {{dpoEmail}}.

**To the Data Protection Board, without delay:** a description of the breach including its nature, extent, timing, location and likely impact. A copy of this first intimation and the Board's acknowledgement are kept.

**To the Board, within {{breachReportWindow}} of becoming aware** (or longer if the Board allows on written request): updated and detailed information on the facts, circumstances and reasons for the breach; mitigation measures; any findings about the person who caused it; remedial measures to prevent recurrence; and a report on the intimations given to Data Principals.

**Where {{companyName}} is a Data Processor,** it notifies the client Data Fiduciary without delay, within the period the contract sets, and supports the client's notifications. {{companyName}} does not notify the client's Data Principals unless the client instructs it to.

**CERT-In.** Cyber security incidents of the types listed in the CERT-In Directions of 28 April 2022 are reported to CERT-In within the period those Directions set. This runs in parallel with, and is shorter than, the Rule 7 timelines. The Security lead files the report; the DPO is copied.

**Other notifications:** contractual and insurer notifications are assessed in parallel by the Security lead and General Counsel.

## 6. Records and exercises

The incident register is reviewed every quarter. Each year {{companyName}} keeps, for the year, every Board intimation and acknowledgement, every Data Principal notice, every detailed report and every post-incident review, or a nil return where there were none. A tabletop exercise is run each year.

## 7. Roles

- **DPO ({{dpoName}}):** owns breach decisions and all Rule 7 notifications.
- **Breach contact ({{breachContact}}):** receives incident reports at any time and starts triage.
- **Security lead:** leads technical response and maintains the incident response plan.
- **CEO:** approves external communications for high-severity incidents.
- **General Counsel:** advises on legal and contractual obligations.

## 8. Evidence

Incident response plan and contact list; incident register with awareness timestamps; notification copies and send times; Board submissions; post-incident review reports; tabletop exercise report.

## 9. Review

Annual, after every notifiable breach, and after the annual tabletop exercise.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}. To report an incident, contact {{breachContact}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Event-based items cover every incident in the period, or a nil return.

- **DPDP-R7-01 Breach detection and triage**: Incident register with discovery, containment, and notification timestamps. Frequency: quarterly.
- **DPDP-R7-01 Breach detection and triage**: Post-incident review and remediation evidence. Frequency: yearly.
- **DPDP-R7-02 Board intimation**: Board first intimation copy and acknowledgement. Frequency: yearly.
- **DPDP-R7-03 Data Principal notification**: Data Principal notification copy in required languages. Frequency: yearly.
- **DPDP-R7-04 Detailed breach report**: Detailed breach report filed within the reporting window. Frequency: yearly.
- **DPDP-R7-04 Detailed breach report**: Annual tabletop exercise report. Frequency: yearly.
- **DPDP-ORG-09 Incident management**: Incident response plan and escalation contact list. Frequency: yearly.
`;
