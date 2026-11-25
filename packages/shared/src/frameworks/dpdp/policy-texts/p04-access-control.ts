// Access Control Policy, as counsel wrote it.
export const P04_TEXT = `> Access to personal data at {{companyName}} is granted on least privilege, protected by MFA, reviewed {{accessReview}}, and removed within {{leaverAccessWithin}} of a person leaving.

## 1. Purpose

To implement the Rule 6(1)(b) safeguard: appropriate measures to control access to the computer resources {{companyName}} and its processors use to process personal data.

## 2. Scope

All user, administrator, service and API accounts on {{companyName}} systems, cloud consoles, SaaS tools, code repositories, databases and client environments.

## 3. Policy statements

**3.1 Least privilege and need-to-know.** Access is granted by role. Access to Restricted data needs a documented business need and approval from the data owner.

**3.2 Unique identity.** Every person has a unique account using a {{companyName}}-issued identity. Personal email accounts must not be used for {{companyName}} systems, including compliance and administration tools. An identity inventory lists every account, its role and its MFA status. Shared accounts are prohibited except break-glass accounts, which are vaulted, monitored and rotated after each use.

**3.3 Authentication.** SSO with MFA is required for email, cloud consoles, code repositories, production systems and any system holding Confidential or Restricted data. Passwords meet the minimum length and complexity set in {{companyName}}'s authentication standard and are checked against known-breached lists. Authentication traffic uses {{minTls}} or higher.

**3.4 Privileged access.** A privileged access list names every admin account with its approval record. Production and admin access is time-bound (just-in-time where supported), logged under P06, and limited to named engineers. No standing direct access to production databases holding personal data.

**3.5 Joiner, mover, leaver.**

- Joiners: access provisioned from an approved request, matched to role.
- Movers: access no longer needed is removed promptly after the role change and confirmed at the next access review.
- Leavers: all access disabled within {{leaverAccessWithin}} of exit (immediately for involuntary exits); devices and tokens recovered.

The HR side of joiners, movers and leavers, including the checklist, is set out in P15.

**3.6 Access reviews.** System owners review and sign off access to every system holding personal data {{accessReview}}. Access found to be unneeded is removed and the removal recorded with the review.

**3.7 Service accounts and secrets.** Service accounts and secrets are inventoried and the inventory is reviewed yearly. Service accounts have the minimum permissions, no interactive login, and credentials stored in a secrets manager and rotated {{keyRotation}} at least, or on suspected exposure.

**3.8 Client environments.** Staff access client systems only through client-approved methods and only for the contracted purpose.

## 4. Roles

- **Security lead:** owns IAM standards, the authentication standard and the review process.
- **System owners:** approve access and perform reviews.
- **HR lead:** notifies IT of joiners, movers and leavers on or before the effective date (P15).

## 5. Evidence

Identity inventory; access review sign-offs; leaver deprovisioning log with timestamps; privileged access list with approvals; service account and secret inventory review.

## 6. Review

Annual.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}. Suspected unauthorised access is reported to {{breachContact}} under P08.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-R6-02 Access control**: Identity inventory with role assignments and MFA status. Frequency: yearly.
- **DPDP-R6-02 Access control**: Access review sign-off by system owners. Frequency: quarterly.
- **DPDP-R6-02 Access control**: Leaver deprovisioning evidence within the leaver deadline. Frequency: quarterly.
- **DPDP-R6-02 Access control**: Service account and secret inventory review. Frequency: yearly.
- **DPDP-R6-02 Access control**: Further proof items are listed in P15.
- **DPDP-R6-03 Authentication and privileged access**: Privileged access list and approval records. Frequency: yearly.
`;
