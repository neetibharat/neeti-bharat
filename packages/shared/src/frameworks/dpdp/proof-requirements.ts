// Proof a company should be able to show, each under the control it supports. Counsel's version: the proof she keeps. Each title starts with its code: RQ required, RC recommended, CD conditional, GP good practice.
import type { ProofFrequency } from './evidence.js';

export interface ProofRequirementTemplate {
  /** For example `PR-P08-02`: the policy that covers the control, and a number within that policy. */
  id: string;
  controlId: string;
  title: string;
  /** What a good answer holds. Empty when the title says it all. */
  description?: string;
  frequency: ProofFrequency;
}

export const PROOF_REQUIREMENTS: readonly ProofRequirementTemplate[] = [
  {
    id: 'PR-P01-01',
    controlId: 'DPDP-R3-01',
    title: 'RQ01 – Published privacy notice',
    description:
      'Required. Template, if you want one: /templates/RQ01_Published_privacy_notice.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.5, s.5(3); DPDP Rules, Rule 3. Proves: That the privacy notice was published, complete and readable in every language offered, on the dates shown.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-02',
    controlId: 'DPDP-R3-02',
    title: 'RQ02 – Consent records for each channel',
    description:
      'Required. Template, if you want one: /templates/RQ02_Consent_records_for_each_channel.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.6(1), s.6(10); Rule 3. Proves: That valid consent was recorded on every channel, so the company can meet its burden of proving notice and consent under s.6(10).',
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-03',
    controlId: 'DPDP-R3-02',
    title: 'RQ03 – Consent withdrawal log',
    description:
      'Required. Template, if you want one: /templates/RQ03_Consent_withdrawal_log.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.6(4), s.6(5), s.6(6); Rule 3(d). Proves: That people could withdraw consent as easily as they gave it, and that the company and its processors stopped processing within a reasonable time.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P05-01',
    controlId: 'DPDP-R6-01',
    title: 'RQ04 – Encryption, masking or tokenisation',
    description:
      'Required. Template, if you want one: /templates/RQ04_Encryption_masking_or_tokenisation.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(a). Proves: That personal data is encrypted, masked or tokenised where stored and when sent over networks. Includes the TLS scan of public endpoints (formerly a separate proof).',
    frequency: 'yearly',
  },
  {
    id: 'PR-P06-02',
    controlId: 'DPDP-R6-04',
    title: 'RQ05 – Logs retained for at least 1 year',
    description:
      'Required. Template, if you want one: /templates/RQ05_Logs_retained_for_at_least_1_year.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(e), Rule 8(3); CERT-In Directions 2022. Proves: That logs are kept for at least 1 year, as Rule 6(1)(e) and Rule 8(3) require.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P07-01',
    controlId: 'DPDP-R6-06',
    title: 'RQ06 – Backup configuration',
    description:
      'Required. Template, if you want one: /templates/RQ06_Backup_configuration.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(d). Proves: That personal data can be recovered if a system is lost, compromised or destroyed.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P08-02',
    controlId: 'DPDP-R7-02',
    title: 'RQ07 – Breach intimation to the Data Protection Board',
    description:
      'Required. Template, if you want one: /templates/RQ07_Breach_intimation_to_the_Data_Protection_Board.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(6); Rule 7(2)(a). Fill in each time a breach occurs. Proves: That the Data Protection Board was told of the breach without delay, with the details Rule 7(2)(a) requires.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P08-03',
    controlId: 'DPDP-R7-04',
    title: 'RQ08 – Detailed breach report within 72 hours',
    description:
      'Required. Template, if you want one: /templates/RQ08_Detailed_breach_report_within_72_hours.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(6); Rule 7(2)(b). Fill in each time a breach occurs. Proves: That the detailed report reached the Data Protection Board within 72 hours of the company becoming aware of the breach, or within any longer time the Board allowed.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P08-04',
    controlId: 'DPDP-R7-03',
    title: 'RQ09 – Breach notice to affected individuals in clear and plain language',
    description:
      'Required. Template, if you want one: /templates/RQ09_Breach_notice_to_affected_individuals_in_clear_and_plain_language.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(6); Rule 7(1). Fill in each time a breach occurs. Proves: That affected people were told of the breach without delay, in plain words, with what Rule 7(1) requires.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P10-01',
    controlId: 'DPDP-R14-01',
    title: 'RQ10 – Published channel for rights requests',
    description:
      'Required. Template, if you want one: /templates/RQ10_Published_channel_for_rights_requests.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act ss.11–14; Rule 14(1). Proves: That people can see how to use their rights, what to provide, and how long a response takes.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P11-01',
    controlId: 'DPDP-R9-01',
    title: 'RQ11 – Published DPO or contact person',
    description:
      'Required. Template, if you want one: /templates/RQ11_Published_DPO_or_contact_person.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(9), s.13; Rule 9. Proves: That people can find who to contact about their data, and that the contact actually works.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P12-02',
    controlId: 'DPDP-R6-07',
    title: 'RQ12 – Signed data processing agreements with vendors',
    description:
      "Required. Template, if you want one: /templates/RQ12_Signed_data_processing_agreements_with_vendors.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(2); Rule 6(1)(f). Proves: That every processor handles the company's personal data under a valid signed contract.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-04',
    controlId: 'DPDP-R3-03',
    title: 'RQ14 – Lawful basis register',
    description:
      'Required. Template, if you want one: /templates/RQ14_Lawful_basis_register.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.4, s.6, s.7. Proves: That every processing activity rests on consent or a legitimate use permitted by Section 7.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P11-03',
    controlId: 'DPDP-R14-02',
    title: 'RQ18 – Report showing grievances resolved within 90 days',
    description:
      'Required. Legal basis: DPDP Act s.8(10), s.13; Rule 14(3). Proves: That grievances were resolved within the 90-day limit, with a clear count of any that were not.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P01-05',
    controlId: 'DPDP-R3-01',
    title: 'RQ19 – Privacy notice in English and Eighth Schedule languages',
    description:
      'Required. Template, if you want one: /templates/RQ19_Privacy_notice_in_English_and_Eighth_Schedule_languages.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.5(3). Proves: That people have the option to read the notice in English or in any of the 22 languages in the Eighth Schedule to the Constitution.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-06',
    controlId: 'DPDP-R3-01',
    title: 'RQ20 – Notice to existing users whose data was collected before the Act',
    description:
      'Required. Template, if you want one: /templates/RQ20_Notice_to_existing_users_whose_data_was_collected_before_the_Act.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.5(2); Rule 3. Proves: That people whose data was collected before the Act were sent a notice as soon as reasonably practicable.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P03-03',
    controlId: 'DPDP-R6-08',
    title: 'RC01 – Security awareness training',
    description:
      'Recommended. Template, if you want one: /templates/RC01_Security_awareness_training.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(g). Proves: That everyone who handles personal data was trained, as an organisational safeguard.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P04-01',
    controlId: 'DPDP-R6-02',
    title: 'RC02 – User list, roles and MFA status',
    description:
      'Recommended. Template, if you want one: /templates/RC02_User_list_roles_and_MFA_status.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(b). Proves: That access to personal data is limited to named people in approved roles, with multi-factor sign-in.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P04-04',
    controlId: 'DPDP-R6-02',
    title: 'RC03 – Access removal for leavers',
    description:
      'Recommended. Template, if you want one: /templates/RC03_Access_removal_for_leavers.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(b). Proves: That people who left lost access to personal data within the deadline set in policy.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P04-03',
    controlId: 'DPDP-R6-03',
    title: 'RC04 – Privileged (admin) access list',
    description:
      'Recommended. Template, if you want one: /templates/RC04_Privileged_admin_access_list.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(b), (c). Proves: That admin-level access to personal data is approved, limited and recorded.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P06-01',
    controlId: 'DPDP-R6-04',
    title: 'RC05 – Log source inventory',
    description:
      'Recommended. Template, if you want one: /templates/RC05_Log_source_inventory.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(c), (e). Proves: That every system holding personal data records who accessed it, and those records reach a central store.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P06-04',
    controlId: 'DPDP-R6-05',
    title: 'RC06 – Periodic log review',
    description:
      'Recommended. Template, if you want one: /templates/RC06_Periodic_log_review.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(c). Proves: That access logs were actually reviewed each month and problems were followed up.',
    frequency: 'monthly',
  },
  {
    id: 'PR-P07-02',
    controlId: 'DPDP-R6-06',
    title: 'RC07 – Backup restore test',
    description:
      'Recommended. Template, if you want one: /templates/RC07_Backup_restore_test.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(d). Proves: That backups actually restore, within the target time and without data loss or corruption.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P08-01',
    controlId: 'DPDP-R7-01',
    title: 'RC08 – Incident register',
    description:
      'Recommended. Template, if you want one: /templates/RC08_Incident_register.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(6); Rule 7; CERT-In Directions 2022. Proves: That every security incident was assessed, and every personal data breach was reported on time.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P09-01',
    controlId: 'DPDP-R8-01',
    title: 'RC09 – Retention schedule',
    description:
      'Recommended. Template, if you want one: /templates/RC09_Retention_schedule.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(7); Rule 8; Third Schedule. Proves: That every type of personal data has an approved retention period tied to its purpose or a legal duty.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P09-02',
    controlId: 'DPDP-R8-02',
    title: 'RC10 – Deletion records',
    description:
      'Recommended. Template, if you want one: /templates/RC10_Deletion_records.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(7); Rule 8. Proves: That data was actually deleted when its retention period ended.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P09-04',
    controlId: 'DPDP-R8-03',
    title: 'RC11 – Vendor deletion confirmations',
    description:
      'Recommended. Template, if you want one: /templates/RC11_Vendor_deletion_confirmations.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.6(6), s.8(7)(b). Proves: That processors holding the data also deleted it, and confirmed in writing.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P10-02',
    controlId: 'DPDP-R14-01',
    title: 'RC12 – Rights request register',
    description:
      'Recommended. Template, if you want one: /templates/RC12_Rights_request_register.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act ss.11–14; Rule 14. Proves: That every rights request was logged, verified and answered correctly and on time, including access, correction, erasure and nomination (formerly separate proofs).',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P11-02',
    controlId: 'DPDP-R14-02',
    title: 'RC13 – Grievance register showing resolution within 90 days',
    description:
      'Recommended. Template, if you want one: /templates/RC13_Grievance_register_showing_resolution_within_90_days.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(10), s.13; Rule 14(3). Proves: That every grievance was resolved within 90 days.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P14-02',
    controlId: 'DPDP-R15-01',
    title: 'RC14 – Restricted-country check for data sent abroad',
    description:
      'Recommended. Template, if you want one: /templates/RC14_Restricted_country_check_for_data_sent_abroad.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.16; Rule 15. Proves: That no personal data went to a country restricted by the Central Government, and the legal position was checked.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-07',
    controlId: 'DPDP-R3-02',
    title: 'RC15 – Test showing withdrawal is as easy as giving consent',
    description:
      'Recommended. Template, if you want one: /templates/RC15_Test_showing_withdrawal_is_as_easy_as_giving_consent.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.6(4). Proves: That withdrawing consent takes no more effort than giving it.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P04-05',
    controlId: 'DPDP-R6-02',
    title: 'RC16 – Quarterly access review signed by system owners',
    description:
      'Recommended. Template, if you want one: /templates/RC16_Quarterly_access_review_signed_by_system_owners.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(b). Proves: That system owners checked who has access each quarter and removed what was not needed.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P05-02',
    controlId: 'DPDP-R6-01',
    title: 'RC17 – Encryption keys and secrets inventory',
    description:
      'Recommended. Template, if you want one: /templates/RC17_Encryption_keys_and_secrets_inventory.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(a). Proves: That encryption keys and secrets are known, protected and rotated.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P03-04',
    controlId: 'DPDP-R6-08',
    title: 'RC18 – Staff confidentiality agreements',
    description:
      'Recommended. Template, if you want one: /templates/RC18_Staff_confidentiality_agreements.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(g). Proves: That everyone with access to personal data is bound to keep it confidential.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P03-05',
    controlId: 'DPDP-ORG-04',
    title: 'RC19 – Security risk assessment and action plan',
    description:
      'Recommended. Template, if you want one: /templates/RC19_Security_risk_assessment_and_action_plan.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5). Proves: That the company identified security risks to personal data and is acting on them.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P02-01',
    controlId: 'DPDP-ORG-05',
    title: 'RC20 – Vendor security assessment before data is shared',
    description:
      "Recommended. Template, if you want one: /templates/RC20_Vendor_security_assessment_before_data_is_shared.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(2), s.8(5); Rule 6(1)(f). Proves: That a vendor's security was checked before it received personal data.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-08',
    controlId: 'DPDP-R3-03',
    title: 'RC21 – Data minimisation review',
    description:
      'Recommended. Template, if you want one: /templates/RC21_Data_minimisation_review.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.6(1). Proves: That the company collects only the personal data it needs for each purpose.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P08-05',
    controlId: 'DPDP-ORG-09',
    title: 'RC22 – Post-breach review and remedial actions',
    description:
      'Recommended. Template, if you want one: /templates/RC22_Post_breach_review_and_remedial_actions.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 7(2)(b). Fill in each time a breach occurs. Proves: That the company found the cause of a breach and fixed it.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P08-06',
    controlId: 'DPDP-ORG-09',
    title: 'RC23 – Breach response drill (tabletop exercise)',
    description:
      'Recommended. Template, if you want one: /templates/RC23_Breach_response_drill_tabletop_exercise.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(6); Rule 7. Proves: That the team can meet breach reporting deadlines in practice.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P09-05',
    controlId: 'DPDP-R8-01',
    title: 'RC24 – Legal hold register for data kept under other laws',
    description:
      'Recommended. Template, if you want one: /templates/RC24_Legal_hold_register_for_data_kept_under_other_laws.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(7); Rule 8. Proves: That data kept beyond its purpose is kept only because another law requires it.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P11-04',
    controlId: 'DPDP-R9-01',
    title: 'RC25 – Published route to complain to the Data Protection Board',
    description:
      "Recommended. Template, if you want one: /templates/RC25_Published_route_to_complain_to_the_Data_Protection_Board.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.13(3), s.5(1). Proves: That people are told they can complain to the Data Protection Board after using the company's grievance process.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P19-01',
    controlId: 'DPDP-ORG-02',
    title: 'RC26 – Policy approval records',
    description:
      'Recommended. Template, if you want one: /templates/RC26_Policy_approval_records.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 6(1)(g). Proves: That privacy and security policies were approved by the right person and kept up to date.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P02-02',
    controlId: 'DPDP-ORG-06',
    title: 'RC27 – Accuracy check for data used in decisions or shared',
    description:
      'Recommended. Template, if you want one: /templates/RC27_Accuracy_check_for_data_used_in_decisions_or_shared.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(3). Proves: That personal data used to make a decision about a person, or shared with another fiduciary, was complete, accurate and consistent.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P19-02',
    controlId: 'DPDP-ORG-11',
    title: 'RC28 – Register of government information requests',
    description:
      'Recommended. Template, if you want one: /templates/RC28_Register_of_government_information_requests.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.36; DPDP Rules, rule on calling for information, Seventh Schedule. Proves: That every request for information from the government or the Data Protection Board was checked, answered and recorded.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P02-03',
    controlId: 'DPDP-ORG-06',
    title: 'RC29 – Records of processing',
    description:
      'Required. Template, if you want one: /templates/RC29_Records_of_processing.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(1). Proves: That the company knows what personal data it holds, why, where it is kept and who can reach it.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P02-04',
    controlId: 'DPDP-ORG-05',
    title: 'RC30 – Vendor (processor) register',
    description:
      'Required. Template, if you want one: /templates/RC30_Vendor_processor_register.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(2). Proves: That every vendor processing personal data for the company is known and under contract.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P10-03',
    controlId: 'DPDP-R14-01',
    title: 'RC31 – Identity verification records for rights requests',
    description:
      "Required. Template, if you want one: /templates/RC31_Identity_verification_records_for_rights_requests.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(5); Rule 14. Proves: That data was shared or changed only after confirming the requester's identity.",
    frequency: 'quarterly',
  },
  {
    id: 'PR-P09-03',
    controlId: 'DPDP-R8-02',
    title: 'CD01 – Notice at least 48 hours before erasure',
    description:
      'Conditional: only for Third Schedule platforms (large e-commerce, gaming, social media). Template, if you want one: /templates/CD01_Notice_at_least_48_hours_before_erasure.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(8); Rule 8(2); Third Schedule. Proves: That people were warned at least 48 hours before their data was erased for inactivity.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P13-02',
    controlId: 'DPDP-R10-01',
    title: 'CD02 – Verifiable parental consent',
    description:
      "Conditional: only if the company processes children's data. Template, if you want one: /templates/CD02_Verifiable_parental_consent.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.9(1); Rule 10; Fourth Schedule. Proves: That a verified parent consented before any child's data was processed.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P13-05',
    controlId: 'DPDP-R10-02',
    title: 'CD03 – No tracking or targeted advertising to children',
    description:
      "Conditional: only if the company processes children's data. Template, if you want one: /templates/CD03_No_tracking_or_targeted_advertising_to_children.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.9(3); Fourth Schedule. Proves: That children are not tracked, behaviourally monitored or targeted with advertising.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P13-03',
    controlId: 'DPDP-R11-01',
    title: 'CD04 – Guardian consent for persons with disabilities',
    description:
      'Conditional: only if the company processes data of persons with disabilities who have a lawful guardian. Template, if you want one: /templates/CD04_Guardian_consent_for_persons_with_disabilities.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.9(1); Rule 11. Proves: That consent came from a lawfully appointed guardian, and the appointment was checked.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-02',
    controlId: 'DPDP-R13-02',
    title: 'CD05 – DPO based in India',
    description:
      'Conditional: only if notified as a Significant Data Fiduciary. Template, if you want one: /templates/CD05_DPO_based_in_India.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.10(2)(a). Proves: That a Data Protection Officer based in India was appointed and is answerable to the Board of Directors.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-03',
    controlId: 'DPDP-R13-03',
    title: 'CD06 – Independent data auditor and annual audit',
    description:
      'Conditional: only if notified as a Significant Data Fiduciary. Template, if you want one: /templates/CD06_Independent_data_auditor_and_annual_audit.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.10(2)(b); Rule 13(1), (2). Proves: That an independent data auditor audited the company, and significant observations went to the Data Protection Board.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-04',
    controlId: 'DPDP-R13-04',
    title: 'CD07 – Annual Data Protection Impact Assessment',
    description:
      "Conditional: only if notified as a Significant Data Fiduciary. Template, if you want one: /templates/CD07_Annual_Data_Protection_Impact_Assessment.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.10(2)(c)(i); Rule 13(1), (2). Proves: That the company assessed the risks its processing poses to people's rights, and is acting on them.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-05',
    controlId: 'DPDP-R13-06',
    title: 'CD08 – Localisation of specified data',
    description:
      'Conditional: only if notified as a Significant Data Fiduciary and the government has specified the data. Template, if you want one: /templates/CD08_Localisation_of_specified_data.docx. Fill it in and upload it here, or upload your own proof. Legal basis: Rule 13(4). Proves: That data categories the Central Government requires to stay in India are stored only in India.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P18-02',
    controlId: 'DPDP-R13-05',
    title: 'CD09 – Algorithmic due diligence',
    description:
      "Conditional: only if notified as a Significant Data Fiduciary. Template, if you want one: /templates/CD09_Algorithmic_due_diligence.docx. Fill it in and upload it here, or upload your own proof. Legal basis: Rule 13(3). Proves: That algorithms and AI systems handling personal data were checked for risks to people's rights before use.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P18-06',
    controlId: 'DPDP-R16-01',
    title: 'CD10 – Research or statistics safeguards (Rule 16)',
    description:
      'Conditional: only if the company uses data for research, archiving or statistics. Template, if you want one: /templates/CD10_Research_or_statistics_safeguards_Rule_16.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.17(2)(b); Rule 16; Second Schedule. Proves: That any reliance on the research exemption met the Second Schedule standards.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P13-06',
    controlId: 'DPDP-R10-01',
    title: 'CD11 – Age verification setup and test results',
    description:
      "Conditional: only if the company processes children's data. Template, if you want one: /templates/CD11_Age_verification_setup_and_test_results.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.9; Rule 10. Proves: That the service can tell when a user is a child and routes them to parental consent.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P13-07',
    controlId: 'DPDP-R12-01',
    title: 'CD12 – Register of Fourth Schedule exemptions relied on',
    description:
      "Conditional: only if the company relies on a children's data exemption. Template, if you want one: /templates/CD12_Register_of_Fourth_Schedule_exemptions_relied_on.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.9(4), s.9(5); Rule 12; Fourth Schedule. Proves: That any exemption from the children's data rules is identified and its conditions are met.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P17-06',
    controlId: 'DPDP-R13-01',
    title: 'CD13 – Government notification of SDF status',
    description:
      'Conditional: only if notified as a Significant Data Fiduciary. Template, if you want one: /templates/CD13_Government_notification_of_SDF_status.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.10(1). Proves: That the company recorded its notification as a Significant Data Fiduciary and started the extra duties.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P01-09',
    controlId: 'DPDP-R4-01',
    title: 'CD14 – Agreement with a registered Consent Manager',
    description:
      'Conditional: only if the company accepts consent through a Consent Manager. Template, if you want one: /templates/CD14_Agreement_with_a_registered_Consent_Manager.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.6(7)–(9); Rule 4. Proves: That any Consent Manager used is registered with the Data Protection Board and under contract.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P13-08',
    controlId: 'DPDP-R10-02',
    title: "CD15 – Children's well-being check",
    description:
      "Conditional: only if the company processes children's data. Template, if you want one: /templates/CD15_Children_s_well_being_check.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.9(2). Proves: That the company does not process children's data in a way likely to harm their well-being.",
    frequency: 'yearly',
  },
  {
    id: 'PR-P12-03',
    controlId: 'DPDP-R6-07',
    title: 'CD16 – Records of processing done for clients (as a Data Processor)',
    description:
      'Conditional: only if the company processes personal data on behalf of other companies. Template, if you want one: /templates/CD16_Records_of_processing_done_for_clients_as_a_Data_Processor.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.8(2), s.8(7)(b); Rule 6(1)(f). Proves: That, when acting for clients, the company processed data only on their instructions, alerted them to breaches and deleted data when told.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P14-03',
    controlId: 'DPDP-R15-01',
    title: 'CD17 – Register of data sent outside India',
    description:
      'Required. Template, if you want one: /templates/CD17_Register_of_data_sent_outside_India.docx. Fill it in and upload it here, or upload your own proof. Legal basis: DPDP Act s.16; Rule 15. Proves: That every transfer of personal data outside India is recorded and checked.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P19-03',
    controlId: 'DPDP-ORG-10',
    title: 'GP01 – Website check report',
    description:
      'Good practice (optional). Template, if you want one: /templates/GP01_Website_check_report.docx. Fill it in and upload it here, or upload your own proof. Proves: That the public website shows the privacy notice, handles cookies fairly and has basic security in place. Can be generated by the DPDP Kit website check.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P19-04',
    controlId: 'DPDP-ORG-10',
    title: 'GP02 – Cloud configuration check report',
    description:
      'Good practice (optional). Template, if you want one: /templates/GP02_Cloud_configuration_check_report.docx. Fill it in and upload it here, or upload your own proof. Proves: That cloud settings for personal data systems were checked and failures fixed. Can be generated by the DPDP Kit cloud tests.',
    frequency: 'quarterly',
  },
  {
    id: 'PR-P16-01',
    controlId: 'DPDP-ORG-07',
    title: 'GP03 – Privacy-by-design checklist for new features',
    description:
      'Good practice (optional). Template, if you want one: /templates/GP03_Privacy_by_design_checklist_for_new_features.docx. Fill it in and upload it here, or upload your own proof. Proves: That privacy was considered before a feature using personal data went live.',
    frequency: 'yearly',
  },
  {
    id: 'PR-P03-06',
    controlId: 'DPDP-ORG-04',
    title: 'GP04 – Register of AI tools that use personal data',
    description:
      'Good practice (optional). Template, if you want one: /templates/GP04_Register_of_AI_tools_that_use_personal_data.docx. Fill it in and upload it here, or upload your own proof. Proves: That the company knows which AI tools receive personal data and under what terms.',
    frequency: 'yearly',
  },
];
