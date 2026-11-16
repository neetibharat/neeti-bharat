import type { RecordInput } from '../../activity/services/activity.service';

type About = Pick<RecordInput, 'subject' | 'details'>;

/** What the log says a change is about, so each service names its subjects the same way. */
export function aboutControl(
  control: { id: string; title: string },
  extra: { proof?: string } = {},
): About {
  return {
    subject: { type: 'control', id: control.id },
    details: { controlId: control.id, title: control.title, ...extra },
  };
}

export function aboutPolicy(policy: { id: string; title: string }): About {
  return {
    subject: { type: 'policy', id: policy.id },
    details: { policyId: policy.id, title: policy.title },
  };
}

export function aboutFramework(id: string, name: string): About {
  return { subject: { type: 'framework', id }, details: { name } };
}

export function aboutRequirement(
  id: string,
  rule: { reference: string; title: string },
  framework: string,
): About {
  return {
    subject: { type: 'requirement', id },
    details: { reference: rule.reference, title: rule.title, framework },
  };
}
