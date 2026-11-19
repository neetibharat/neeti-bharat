// Encryption and Key Management Standard, as counsel wrote it.
export const P05_TEXT = `> All personal data at {{companyName}} is encrypted in transit and at rest, and Restricted data is additionally masked or tokenised wherever full values are not needed.

## 1. Purpose

To implement the Rule 6(1)(a) safeguard: securing personal data through encryption, obfuscation, masking or virtual tokens mapped to the data.

## 2. Scope

All {{companyName}} and client personal data in databases, object storage, backups, logs, endpoints, removable media, email and data in transit between any systems.

## 3. Requirements

- **In transit (external):** Minimum requirement: {{minTls}} or higher, TLS 1.3 preferred; HSTS on public web apps; no SSL or TLS 1.0/1.1
- **In transit (internal):** Minimum requirement: TLS ({{minTls}} or higher) or mutual TLS between services handling Confidential or Restricted data
- **At rest (cloud storage, DBs, backups):** Minimum requirement: {{encryptionStandard}} or provider equivalent, with managed keys
- **Endpoints:** Minimum requirement: Full-disk encryption on all laptops and mobile devices
- **Restricted fields (IDs, financial data, credentials):** Minimum requirement: Field-level encryption, tokenisation or masking in addition to storage encryption
- **Passwords:** Minimum requirement: Salted adaptive hash (bcrypt, scrypt or Argon2); never reversible encryption
- **Non-production:** Minimum requirement: No real Restricted data; use synthetic, masked or tokenised data

Public endpoints are scanned every quarter to confirm the TLS configuration.

## 4. Key management

- A key inventory records every key, its owner, purpose and last rotation date; a secrets inventory does the same for API keys, tokens and passwords.
- Keys are generated and stored in a cloud KMS or HSM in {{hostingRegion}}; never hard-coded or committed to source control.
- Data encryption keys are rotated {{keyRotation}} at least; immediately if compromise is suspected.
- Key administration is separated from data access; only named administrators can manage keys, and all key operations are logged under P06.
- Keys for client data are segregated per client where the platform supports it.
- Key destruction follows data erasure under P09 where crypto-shredding is used.

## 5. Display and export

User interfaces show masked values by default. Bulk exports of personal data need data owner approval and are encrypted.

## 6. Roles

- **Security lead:** owns the standard and approved algorithm list.
- **Engineering lead:** implements controls in applications (see P16).

## 7. Evidence

Encryption configuration exports; TLS scan results; key and secrets inventories with rotation evidence; masking and tokenisation configuration; device encryption compliance report.

## 8. Review

Annual, and when cryptographic guidance changes.

## Exceptions

Any departure from this policy needs a written exception that states the reason, the compensating controls and an end date within the maximum exception period set under P19. It is approved by this policy's approver and recorded in the exception log.

## Contact

Questions about this policy go to the Data Protection Officer, {{dpoName}}, at {{dpoEmail}}. Suspected key or secret exposure is reported to {{breachContact}} under P08.

## Appendix: Audit controls and required proof

This policy covers the controls below from the DPDP audit checklist. Proof items and frequencies match the compliance platform. Where a control is shared, its proof items are listed once, in the policy named.

- **DPDP-R6-01 Encryption at rest and in transit**: Encryption configuration export for databases, storage, and backups. Frequency: yearly.
- **DPDP-R6-01 Encryption at rest and in transit**: TLS configuration scan for public endpoints. Frequency: quarterly.
- **DPDP-R6-01 Encryption at rest and in transit**: Key inventory with rotation dates and owners. Frequency: yearly.
- **DPDP-R6-01 Encryption at rest and in transit**: Secrets inventory and rotation evidence. Frequency: yearly.
- **DPDP-R6-01 Encryption at rest and in transit**: Masking and tokenisation configuration for sensitive fields. Frequency: yearly.
`;
