import { describe, expect, it } from 'vitest';
import { escapeHtml, renderHtml, renderText, type EmailContent } from './email-layout';
import { renderMail } from './templates';

describe('renderMail', () => {
  it('writes the sign-in email with its link and how long it lasts, as text and as HTML', () => {
    const { subject, text, html } = renderMail('en', 'signIn', {
      url: 'https://x.in/go?a=1&b=2',
      minutes: 5,
    });
    expect(subject).toContain('sign-in');
    expect(text).toContain('https://x.in/go?a=1&b=2');
    expect(text).toContain('5 minutes');
    // In HTML the link is escaped, and there is a button and a plain link to paste.
    expect(html).toContain('href="https://x.in/go?a=1&amp;b=2"');
    expect(html).toContain('>Sign in</a>');
    expect(html).toContain('5 minutes');
  });

  it('writes the invitation with who invited, to what, in which role, and how long it is valid', () => {
    const { subject, text, html } = renderMail('en', 'invitation', {
      url: 'https://x.in',
      days: 7,
      organization: 'Acme Pvt Ltd',
      inviter: 'Asha',
      role: 'auditor',
    });
    expect(subject).toBe('You are invited to Acme Pvt Ltd on Neeti Bharat');
    for (const body of [text, html]) {
      expect(body).toContain('Asha');
      expect(body).toContain('Acme Pvt Ltd');
      expect(body).toContain('read-only');
      expect(body).toContain('7 days');
      expect(body).toContain('https://x.in');
    }
  });

  it('keeps a name that came from a person from becoming markup', () => {
    const { html } = renderMail('en', 'invitation', {
      url: 'https://x.in',
      days: 7,
      organization: '<script>alert(1)</script> & Co',
      inviter: '"Mallory" <m@x.in>',
      role: 'member',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; Co');
    expect(html).toContain('&quot;Mallory&quot; &lt;m@x.in&gt;');
  });
});

describe('the notice email', () => {
  const base = { url: 'https://x.in/en/my-work', organization: 'Alpha', dueOn: '2026-11-12' };

  it('says what is late, or what is due soon, and when', () => {
    const late = renderMail('en', 'notice', {
      ...base,
      kind: 'request',
      state: 'overdue',
      title: 'Asha',
    });
    expect(late.subject).toBe('Late: The request from Asha (Alpha)');
    expect(late.text).toContain('was due on 2026-11-12 and is late');
    const soon = renderMail('en', 'notice', {
      ...base,
      kind: 'proof',
      state: 'due_soon',
      title: 'TLS scan',
    });
    expect(soon.subject).toBe('Due soon: The proof “TLS scan” (Alpha)');
    expect(soon.text).toContain('is due on 2026-11-12');
  });

  it('keeps a name that came from a person from becoming markup', () => {
    const { html } = renderMail('en', 'notice', {
      ...base,
      kind: 'request',
      state: 'overdue',
      title: '<b>x</b>',
    });
    expect(html).not.toContain('<b>x</b>');
  });
});

describe('the email layout', () => {
  const content: EmailContent = {
    preheader: 'Hidden line',
    heading: 'Hello',
    paragraphs: ['One.', 'Two.'],
    footer: 'Footer words',
  };

  it('shows the brand, the heading and the footer, and has no button when there is none', () => {
    const html = renderHtml(content);
    expect(html).toContain('Neeti Bharat');
    expect(html).toContain('Hello');
    expect(html).toContain('Footer words');
    expect(html).not.toContain('Or paste this link');
  });

  it('uses tables and inline styles only, so mail apps draw it as written', () => {
    const html = renderHtml(content);
    expect(html).not.toMatch(/<style|<script|<link|<img/i);
    expect(html).toContain('role="presentation"');
  });

  it('writes the same words as plain text', () => {
    expect(renderText({ ...content, button: { label: 'Go', url: 'https://x.in' } })).toBe(
      'Hello\n\nOne.\n\nTwo.\n\nGo: https://x.in\n\n-- Footer words',
    );
  });

  it('escapes the five characters that matter', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});
