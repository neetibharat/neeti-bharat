// AI and Automated Decision-Making Policy, as counsel wrote it.
export const P18_TEXT = `> {{companyName}} uses AI and automated decision systems on personal data only after registration and risk assessment, with human review of decisions that significantly affect people, and never feeds client or customer personal data into external AI tools without approval.

## 1. Purpose

To make sure AI use complies with the Act's general duties (lawful ground, notice, purpose limitation, accuracy, security, erasure), meets the Rule 13 algorithmic due diligence duty if {{companyName}} is an SDF (s.10; setup answer: {{isSignificantFiduciary}}), and applies the Rule 16 conditions where processing relies on the research, archiving or statistical purposes exemption.

## 2. Scope

Any machine learning model, generative AI tool, scoring or ranking system, or rules-based automated decision system that processes personal data, whether built by {{companyName}}, embedded in a vendor product, or used by staff (e.g. AI assistants, coding tools, meeting transcription).

## 3. Policy statements

**3.1 AI register.** The AI owner keeps a register of every AI and automated decision system: purpose, personal data used (training, input, output), the people affected, model provider, hosting location (default {{hostingRegion}}), risk tier, human oversight, and DPIA reference. The register applies to every organisation, whatever its SDF status.

**3.2 Risk tiers.**

- **High:** Examples: Decisions on hiring, performance, credit, access to services, or processing children's data; Requirements: DPIA (P17), bias and accuracy testing, human review before any decision takes effect, DPO approval
- **Medium:** Examples: Personalisation, support triage, analytics on personal data; Requirements: Lightweight assessment, opt-out where feasible, monitoring
- **Low:** Examples: Productivity tools with no personal data, or anonymised data only; Requirements: Register entry and acceptable-use rules

**3.3 Lawful use of data.** Personal data is used to train or fine-tune models only where the purpose is covered by the original notice and consent or a legitimate use (P01), or the data is anonymised. Client data is never used to train models without the client's written permission.

**3.4 External AI tools and models.** Every third-party model or API is assessed before use for data use, retention, training and transfer outside India; the assessment is kept. Staff may not paste Confidential or Restricted data into AI tools that are not approved by Security and covered by a DPA that bars training on {{companyName}} data (P12).

**3.5 Transparency and rights.** Notices (P01) say when AI is used in a way that affects people. Rights requests (P10, at {{grievanceEmail}}) cover data held in AI systems where technically feasible, including correction and erasure of inputs and outputs.

**3.6 Algorithmic due diligence (Rule 13, if SDF).** Before deployment and at least annually, the AI owner verifies the system is not likely to pose a risk to Data Principals' rights, covering accuracy, bias, security and explainability, and records the result for the DPO. {{companyName}} may apply this to high-tier systems as good practice even if it is not an SDF.

**3.7 Research and statistical exemption (Rule 16).** Processing personal data for research, archiving or statistical purposes in reliance on the exemption is allowed only if it meets the standards in the relevant Schedule to the Rules and the data is not used to make decisions about specific individuals. Each year the DPO confirms in writing whether {{companyName}} relies on this exemption and, if it does, records how each use meets these conditions.

**3.8 Human oversight and contestability.** For high-tier systems, records show who reviewed each significant decision, the explanation given to the person, and how they could contest it.

**3.9 Monitoring.** High and medium tier systems are monitored for bias, drift, accuracy and harmful outputs, with periodic monitoring reports; serious failures are handled as incidents under P08 and reported to {{breachContact}}.

## 4. Roles

- **AI owner:** owns the register, assessments and monitoring. The named person is recorded in the role-holder register under P19.
- **DPO ({{dpoName}}):** approves high-tier systems and Rule 16 reliance; approves this policy.
- **Security lead:** approves external AI tools.

## 5. Evidence

AI register; third-party model assessments; DPIAs; due diligence assessments; human oversight records; monitoring reports; annual Rule 16 confirmation and safeguard check.

## 6. Review

Annual, and when new AI regulation or Board guidance is issued.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-ORG-04 Risk assessment**: AI and automated decision system register with purpose, data, and affected persons. Frequency: yearly.
- **DPDP-ORG-04 Risk assessment**: Third-party model and API assessment for data use, retention, and transfer. Frequency: yearly.
- **DPDP-ORG-04 Risk assessment**: Further proof items are listed in P03 and P17.
- **DPDP-R13-05 Algorithm due diligence** (applies if the organisation performs this activity): Algorithm and AI due diligence assessment before deployment and annually. Frequency: yearly.
- **DPDP-R13-05 Algorithm due diligence** (applies if the organisation performs this activity): Human oversight, explanation, and contestability records. Frequency: yearly.
- **DPDP-R13-05 Algorithm due diligence** (applies if the organisation performs this activity): Bias, drift, accuracy, and harmful output monitoring reports. Frequency: yearly.
- **DPDP-R16-01 Research safeguards** (applies if the organisation performs this activity): Rule 16 exemption reliance confirmation and safeguard check. Frequency: yearly.
`;
