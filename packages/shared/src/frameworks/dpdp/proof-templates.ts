/** A template that ships with the kit: a file in `apps/web/public/templates/`, downloaded from `/templates/<file>`. */
export interface ProofTemplate {
  file: string;
  /** What it is called in a list. */
  title: string;
  /** The catalogue proof it was written for. A company can use it for any proof. */
  proofId: string;
}

/**
 * The templates that ship with the kit. A template is never required: proof can be uploaded in any form, and a company
 * can link its own templates instead.
 */
export const PROOF_TEMPLATES: readonly ProofTemplate[] = [
  {
    file: 'RQ01_Published_privacy_notice.docx',
    title: 'Published privacy notice',
    proofId: 'PR-P01-01',
  },
  {
    file: 'RQ02_Consent_records_for_each_channel.docx',
    title: 'Consent records for each channel',
    proofId: 'PR-P01-02',
  },
  {
    file: 'RQ03_Consent_withdrawal_log.docx',
    title: 'Consent withdrawal log',
    proofId: 'PR-P01-03',
  },
  {
    file: 'RQ04_Encryption_masking_or_tokenisation.docx',
    title: 'Encryption, masking or tokenisation',
    proofId: 'PR-P05-01',
  },
  {
    file: 'RQ05_Logs_retained_for_at_least_1_year.docx',
    title: 'Logs retained for at least 1 year',
    proofId: 'PR-P06-02',
  },
  {
    file: 'RQ06_Backup_configuration.docx',
    title: 'Backup configuration',
    proofId: 'PR-P07-01',
  },
  {
    file: 'RQ07_Breach_intimation_to_the_Data_Protection_Board.docx',
    title: 'Breach intimation to the Data Protection Board',
    proofId: 'PR-P08-02',
  },
  {
    file: 'RQ08_Detailed_breach_report_within_72_hours.docx',
    title: 'Detailed breach report within 72 hours',
    proofId: 'PR-P08-03',
  },
  {
    file: 'RQ09_Breach_notice_to_affected_individuals_in_clear_and_plain_language.docx',
    title: 'Breach notice to affected individuals in clear and plain language',
    proofId: 'PR-P08-04',
  },
  {
    file: 'RQ10_Published_channel_for_rights_requests.docx',
    title: 'Published channel for rights requests',
    proofId: 'PR-P10-01',
  },
  {
    file: 'RQ11_Published_DPO_or_contact_person.docx',
    title: 'Published DPO or contact person',
    proofId: 'PR-P11-01',
  },
  {
    file: 'RQ12_Signed_data_processing_agreements_with_vendors.docx',
    title: 'Signed data processing agreements with vendors',
    proofId: 'PR-P12-02',
  },
  {
    file: 'RQ14_Lawful_basis_register.docx',
    title: 'Lawful basis register',
    proofId: 'PR-P01-04',
  },
  {
    file: 'RQ19_Privacy_notice_in_English_and_Eighth_Schedule_languages.docx',
    title: 'Privacy notice in English and Eighth Schedule languages',
    proofId: 'PR-P01-05',
  },
  {
    file: 'RQ20_Notice_to_existing_users_whose_data_was_collected_before_the_Act.docx',
    title: 'Notice to existing users whose data was collected before the Act',
    proofId: 'PR-P01-06',
  },
  {
    file: 'RC01_Security_awareness_training.docx',
    title: 'Security awareness training',
    proofId: 'PR-P03-03',
  },
  {
    file: 'RC02_User_list_roles_and_MFA_status.docx',
    title: 'User list, roles and MFA status',
    proofId: 'PR-P04-01',
  },
  {
    file: 'RC03_Access_removal_for_leavers.docx',
    title: 'Access removal for leavers',
    proofId: 'PR-P04-04',
  },
  {
    file: 'RC04_Privileged_admin_access_list.docx',
    title: 'Privileged (admin) access list',
    proofId: 'PR-P04-03',
  },
  {
    file: 'RC05_Log_source_inventory.docx',
    title: 'Log source inventory',
    proofId: 'PR-P06-01',
  },
  {
    file: 'RC06_Periodic_log_review.docx',
    title: 'Periodic log review',
    proofId: 'PR-P06-04',
  },
  {
    file: 'RC07_Backup_restore_test.docx',
    title: 'Backup restore test',
    proofId: 'PR-P07-02',
  },
  {
    file: 'RC08_Incident_register.docx',
    title: 'Incident register',
    proofId: 'PR-P08-01',
  },
  {
    file: 'RC09_Retention_schedule.docx',
    title: 'Retention schedule',
    proofId: 'PR-P09-01',
  },
  {
    file: 'RC10_Deletion_records.docx',
    title: 'Deletion records',
    proofId: 'PR-P09-02',
  },
  {
    file: 'RC11_Vendor_deletion_confirmations.docx',
    title: 'Vendor deletion confirmations',
    proofId: 'PR-P09-04',
  },
  {
    file: 'RC12_Rights_request_register.docx',
    title: 'Rights request register',
    proofId: 'PR-P10-02',
  },
  {
    file: 'RC13_Grievance_register_showing_resolution_within_90_days.docx',
    title: 'Grievance register showing resolution within 90 days',
    proofId: 'PR-P11-02',
  },
  {
    file: 'RC14_Restricted_country_check_for_data_sent_abroad.docx',
    title: 'Restricted-country check for data sent abroad',
    proofId: 'PR-P14-02',
  },
  {
    file: 'RC15_Test_showing_withdrawal_is_as_easy_as_giving_consent.docx',
    title: 'Test showing withdrawal is as easy as giving consent',
    proofId: 'PR-P01-07',
  },
  {
    file: 'RC16_Quarterly_access_review_signed_by_system_owners.docx',
    title: 'Quarterly access review signed by system owners',
    proofId: 'PR-P04-05',
  },
  {
    file: 'RC17_Encryption_keys_and_secrets_inventory.docx',
    title: 'Encryption keys and secrets inventory',
    proofId: 'PR-P05-02',
  },
  {
    file: 'RC18_Staff_confidentiality_agreements.docx',
    title: 'Staff confidentiality agreements',
    proofId: 'PR-P03-04',
  },
  {
    file: 'RC19_Security_risk_assessment_and_action_plan.docx',
    title: 'Security risk assessment and action plan',
    proofId: 'PR-P03-05',
  },
  {
    file: 'RC20_Vendor_security_assessment_before_data_is_shared.docx',
    title: 'Vendor security assessment before data is shared',
    proofId: 'PR-P02-01',
  },
  {
    file: 'RC21_Data_minimisation_review.docx',
    title: 'Data minimisation review',
    proofId: 'PR-P01-08',
  },
  {
    file: 'RC22_Post_breach_review_and_remedial_actions.docx',
    title: 'Post-breach review and remedial actions',
    proofId: 'PR-P08-05',
  },
  {
    file: 'RC23_Breach_response_drill_tabletop_exercise.docx',
    title: 'Breach response drill (tabletop exercise)',
    proofId: 'PR-P08-06',
  },
  {
    file: 'RC24_Legal_hold_register_for_data_kept_under_other_laws.docx',
    title: 'Legal hold register for data kept under other laws',
    proofId: 'PR-P09-05',
  },
  {
    file: 'RC25_Published_route_to_complain_to_the_Data_Protection_Board.docx',
    title: 'Published route to complain to the Data Protection Board',
    proofId: 'PR-P11-04',
  },
  {
    file: 'RC26_Policy_approval_records.docx',
    title: 'Policy approval records',
    proofId: 'PR-P19-01',
  },
  {
    file: 'RC27_Accuracy_check_for_data_used_in_decisions_or_shared.docx',
    title: 'Accuracy check for data used in decisions or shared',
    proofId: 'PR-P02-02',
  },
  {
    file: 'RC28_Register_of_government_information_requests.docx',
    title: 'Register of government information requests',
    proofId: 'PR-P19-02',
  },
  {
    file: 'RC29_Records_of_processing.docx',
    title: 'Records of processing',
    proofId: 'PR-P02-03',
  },
  {
    file: 'RC30_Vendor_processor_register.docx',
    title: 'Vendor (processor) register',
    proofId: 'PR-P02-04',
  },
  {
    file: 'RC31_Identity_verification_records_for_rights_requests.docx',
    title: 'Identity verification records for rights requests',
    proofId: 'PR-P10-03',
  },
  {
    file: 'CD01_Notice_at_least_48_hours_before_erasure.docx',
    title: 'Notice at least 48 hours before erasure',
    proofId: 'PR-P09-03',
  },
  {
    file: 'CD02_Verifiable_parental_consent.docx',
    title: 'Verifiable parental consent',
    proofId: 'PR-P13-02',
  },
  {
    file: 'CD03_No_tracking_or_targeted_advertising_to_children.docx',
    title: 'No tracking or targeted advertising to children',
    proofId: 'PR-P13-05',
  },
  {
    file: 'CD04_Guardian_consent_for_persons_with_disabilities.docx',
    title: 'Guardian consent for persons with disabilities',
    proofId: 'PR-P13-03',
  },
  {
    file: 'CD05_DPO_based_in_India.docx',
    title: 'DPO based in India',
    proofId: 'PR-P17-02',
  },
  {
    file: 'CD06_Independent_data_auditor_and_annual_audit.docx',
    title: 'Independent data auditor and annual audit',
    proofId: 'PR-P17-03',
  },
  {
    file: 'CD07_Annual_Data_Protection_Impact_Assessment.docx',
    title: 'Annual Data Protection Impact Assessment',
    proofId: 'PR-P17-04',
  },
  {
    file: 'CD08_Localisation_of_specified_data.docx',
    title: 'Localisation of specified data',
    proofId: 'PR-P17-05',
  },
  {
    file: 'CD09_Algorithmic_due_diligence.docx',
    title: 'Algorithmic due diligence',
    proofId: 'PR-P18-02',
  },
  {
    file: 'CD10_Research_or_statistics_safeguards_Rule_16.docx',
    title: 'Research or statistics safeguards (Rule 16)',
    proofId: 'PR-P18-06',
  },
  {
    file: 'CD11_Age_verification_setup_and_test_results.docx',
    title: 'Age verification setup and test results',
    proofId: 'PR-P13-06',
  },
  {
    file: 'CD12_Register_of_Fourth_Schedule_exemptions_relied_on.docx',
    title: 'Register of Fourth Schedule exemptions relied on',
    proofId: 'PR-P13-07',
  },
  {
    file: 'CD13_Government_notification_of_SDF_status.docx',
    title: 'Government notification of SDF status',
    proofId: 'PR-P17-06',
  },
  {
    file: 'CD14_Agreement_with_a_registered_Consent_Manager.docx',
    title: 'Agreement with a registered Consent Manager',
    proofId: 'PR-P01-09',
  },
  {
    file: 'CD15_Children_s_well_being_check.docx',
    title: "Children's well-being check",
    proofId: 'PR-P13-08',
  },
  {
    file: 'CD16_Records_of_processing_done_for_clients_as_a_Data_Processor.docx',
    title: 'Records of processing done for clients (as a Data Processor)',
    proofId: 'PR-P12-03',
  },
  {
    file: 'CD17_Register_of_data_sent_outside_India.docx',
    title: 'Register of data sent outside India',
    proofId: 'PR-P14-03',
  },
  {
    file: 'GP01_Website_check_report.docx',
    title: 'Website check report',
    proofId: 'PR-P19-03',
  },
  {
    file: 'GP02_Cloud_configuration_check_report.docx',
    title: 'Cloud configuration check report',
    proofId: 'PR-P19-04',
  },
  {
    file: 'GP03_Privacy_by_design_checklist_for_new_features.docx',
    title: 'Privacy-by-design checklist for new features',
    proofId: 'PR-P16-01',
  },
  {
    file: 'GP04_Register_of_AI_tools_that_use_personal_data.docx',
    title: 'Register of AI tools that use personal data',
    proofId: 'PR-P03-06',
  },
];

/** The file written for each catalogue proof. */
export const PROOF_TEMPLATE_FILES: Readonly<Record<string, string>> = Object.fromEntries(
  PROOF_TEMPLATES.map((template) => [template.proofId, template.file]),
);

/** Where the app serves the templates from. */
export const TEMPLATES_PATH = '/templates/';

/** The sentence that names a template in a proof's description. The description shows the file name as a download. */
export const templateNote = (file: string): string =>
  `Template, if you want one: ${TEMPLATES_PATH}${file}. Fill it in and upload it here, or upload your own proof.`;
