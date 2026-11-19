// Data Retention and Erasure Policy, as counsel wrote it.
export const P09_TEXT = `> {{companyName}} keeps personal data only as long as its purpose needs or the law requires, then erases it, with a minimum hold of {{logKeepPeriod}} on processing logs and related data.

## 1. Purpose

To meet s.8(7), which requires erasure (and erasure by processors) when consent is withdrawn or the specified purpose is no longer being served, unless retention is needed to comply with law; and Rule 8 on when a purpose is deemed no longer served, advance notice of erasure, and the minimum retention of logs for {{logKeepPeriod}}.

## 2. Scope

All personal data {{companyName}} holds as Data Fiduciary, in every system, backup and archive, and data held for {{companyName}} by its processors. Client data held as a processor is retained and erased per client instruction and contract.

## 3. Retention schedule

The schedule is mapped to each processing activity in the RoP (P02), so every activity has one retention period and erasure trigger. Each period is signed off by the activity's data owner, and the sign-off date is recorded in the RoP. The periods below are baseline defaults; each must be checked against the laws that apply to {{companyName}} before sign-off.

- **Customer account and contract data:** Default: Life of contract plus the period tax and accounting law requires
- **Marketing contacts (consent-based):** Default: Until consent is withdrawn or engagement stops for the period set in the consent procedure
- **Website and product analytics (identifiable):** Default: Only as long as the analytics purpose needs, set by the data owner
- **Job applicants not hired:** Default: For the period set by the HR lead after the decision, unless the applicant consents to longer
- **Employee records:** Default: Employment plus the period labour, tax and social security law requires
- **Security and access logs:** Default: Minimum {{logKeepPeriod}} (P06; Rule 8(3) and Rule 6(1)(e))
- **Personal data, traffic data and processing logs for every processing activity:** Default: Minimum {{logKeepPeriod}} from the date of processing, in a restricted hold (Rule 8(3), Seventh Schedule purposes)
- **Support tickets:** Default: For the period set by the data owner after closure
- **Operational backups:** Default: Rolling, on the schedule set in P07 (backups are not the Rule 8(3) hold; see 4.6)

Where a retention period ends but data or logs are still within their minimum hold, the longer period wins.

## 4. Policy statements

**4.1 Purpose no longer served.** Data is erased when its purpose is complete, consent is withdrawn (P01), or a valid erasure request is accepted (P10), unless the law requires retention. For any {{companyName}} service in a Third Schedule class (large e-commerce, online gaming or social media platforms), data is erased after {{inactivityErasureAfter}} of the Data Principal's inactivity, as the Schedule provides.

**4.2 Advance notice.** Where erasure is triggered by the Data Principal's inactivity, {{companyName}} informs them at least {{erasureWarning}} before erasure that their data will be erased unless they log in or otherwise contact {{companyName}}.

**4.3 Erasure method.** Every erasure job is logged and produces a completion certificate (what was erased, from which systems, when, by whom). Erasure means deletion or irreversible anonymisation in live systems, plus removal from active use. Backups expire on schedule and are never restored to bring back erased data. Physical media are destroyed by a certified vendor with a certificate.

**4.4 Processors.** {{companyName}} instructs its processors to erase data at the same triggers and obtains confirmation (P12).

**4.5 Legal hold and exceptions.** General Counsel may suspend erasure for data relevant to litigation or investigation. Holds and any other exceptions to the schedule are recorded in a legal hold and exception register and lifted when no longer needed.

**4.6 Minimum retention (Rule 8(3)).** {{companyName}} and its processors retain the personal data, associated traffic data and other logs of every processing activity for at least {{logKeepPeriod}} from the date of processing, for the purposes set out in the Seventh Schedule, unless another law requires otherwise. When consent is withdrawn, a purpose ends or an erasure request is accepted before that period is up, {{companyName}}:

- stops all use of the data for the original purpose immediately;
- moves only the data and logs Rule 8(3) requires into a restricted hold, encrypted (P05), with access limited to named people and every access logged (P06);
- tells the person their data will be kept in restricted form until the end of the hold and then erased;
- erases it at the end of the hold unless another law or a legal hold requires longer.

The Privacy lead confirms the scope of the Seventh Schedule purposes with General Counsel and records it in the RoP (P02).

## 5. Roles

- **Privacy lead:** owns the schedule and annual erasure attestation.
- **Data owners:** sign off retention periods, run erasure jobs and confirm completion.
- **Engineering lead:** builds automated deletion where possible.
- **DPO ({{dpoName}}):** approves this policy and reviews unsigned retention periods.

## 6. Evidence

Retention schedule with owner sign-offs; erasure job logs and certificates; pre-erasure notice records; processor erasure confirmations; legal hold and exception register.

## 7. Review

Annual, and whenever a new data category or a change in law affects retention.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}. Erasure requests and grievances go to {{grievanceEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-R8-01 Retention schedule**: Approved retention schedule mapped to processing activities. Frequency: yearly.
- **DPDP-R8-01 Retention schedule**: Legal hold and exception register. Frequency: quarterly.
- **DPDP-R8-01 Retention schedule**: Further proof items are listed in P02.
- **DPDP-R8-02 Erasure with notice**: Deletion job logs and completion certificates. Frequency: quarterly.
- **DPDP-R8-02 Erasure with notice**: Pre-erasure notices sent to Data Principals. Frequency: quarterly.
- **DPDP-R8-03 Deletion verification**: Processor deletion confirmations. Frequency: quarterly.
`;
