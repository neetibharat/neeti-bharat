/** The kinds of data the app caches. A query provides tags; a change invalidates the ones it makes stale. */
export const TAG_TYPES = [
  'Activity',
  'Profile',
  'People',
  'Checklist',
  'Policy',
  'Evidence',
  'Proof',
  'Breach',
  'Request',
  'WebsiteCheck',
  'CompanyLogo',
  'Readiness',
  'ApiKey',
  'Connection',
  'Ai',
  'Notification',
  'NotificationPreference',
  'NotificationRoleDefault',
] as const;

/**
 * What each kind of change makes stale. Kept in one place so a screen that shows the same name or number
 * cannot be forgotten when something it depends on changes.
 */
export const CHANGES = {
  // A person's name shows on controls, policy approvers, proof collectors, breaches, requests and the company profile.
  person: [
    'People',
    'Checklist',
    'Policy',
    'Proof',
    'Evidence',
    'Profile',
    'Breach',
    'Request',
    'Activity',
  ],
  // Answers fill the policy text and decide which rules apply.
  profile: ['Profile', 'Policy', 'Checklist', 'Activity'],
  // A control's title, owner and policies show on the checklist, policy pages and the proof list.
  control: ['Checklist', 'Policy', 'Proof', 'Evidence', 'Activity'],
  // A rule's name and reference show on the proof list too.
  rule: ['Checklist', 'Policy', 'Proof', 'Activity'],
  // Proof moves a control's status.
  proof: ['Evidence', 'Proof', 'Checklist', 'Activity'],
  // A breach shows on its list and page, in My work and on the Dashboard. Naming someone moves it in My work.
  breach: ['Breach', 'Activity'],
  // A request shows on its list and page, in My work and on the Dashboard.
  request: ['Request', 'Activity'],
  // A run shows on the Website check page only.
  websiteCheck: ['WebsiteCheck', 'Activity'],
  // The logo shows on General settings only.
  companyLogo: ['CompanyLogo', 'Activity'],
  // A check shows on the Readiness page only.
  readiness: ['Readiness', 'Activity'],
  // Keys show on the API keys page only.
  apiKey: ['ApiKey', 'Activity'],
  // Connections and their runs show on the Connections page only.
  connection: ['Connection', 'Activity'],
  // The AI setting shows on the AI help page and decides whether Add policy offers a file.
  ai: ['Ai', 'Activity'],
  // Notices show in the inbox and on the bell, and are a person's own, so they are not in the activity log.
  notification: ['Notification'],
} as const;
