import { describe, expect, it } from 'vitest';
import { emailsOf, linksOf } from './html';

describe('linksOf', () => {
  it('reads the address and the words of each link, whatever the quotes', () => {
    const html = `<a href="/privacy">Privacy <b>policy</b></a> <a class=x href='/terms'>Terms</a> <a href=/help>Help</a>`;
    expect(linksOf(html)).toEqual([
      { href: '/privacy', text: 'Privacy policy' },
      { href: '/terms', text: 'Terms' },
      { href: '/help', text: 'Help' },
    ]);
  });

  it('finds links that span lines and ignores anchors with no address', () => {
    expect(linksOf('<a\n  href="/x"\n>\n  Go\n</a><a name="top">Top</a>')).toEqual([
      { href: '/x', text: 'Go' },
    ]);
  });
});

describe('emailsOf', () => {
  it('finds addresses in text and in mailto links, in lower case, once each', () => {
    const html =
      '<a href="mailto:Grievance@Acme.in">write</a> or grievance@acme.in, dpo@acme.co.in';
    expect(emailsOf(html)).toEqual(['grievance@acme.in', 'dpo@acme.co.in']);
  });

  it('finds none on a page with none', () => {
    expect(emailsOf('<p>no contact here</p>')).toEqual([]);
  });
});
