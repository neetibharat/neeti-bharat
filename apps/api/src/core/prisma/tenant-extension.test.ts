import { describe, expect, it } from 'vitest';
import { assertOwnRows, scopeArgs, TENANT_MODELS } from './tenant-extension';

const ORG = 'org-1';

describe('scopeArgs', () => {
  it('limits a list, a count and a bulk change to the organisation, keeping the rest of the filter', () => {
    for (const operation of ['findMany', 'findFirst', 'count', 'updateMany', 'deleteMany']) {
      expect(scopeArgs(operation, { where: { id: 'b1' } }, ORG).where).toEqual({
        id: 'b1',
        organizationId: ORG,
      });
    }
    expect(scopeArgs('findMany', undefined, ORG).where).toEqual({ organizationId: ORG });
  });

  it('adds the organisation next to the key of a lookup of one row', () => {
    for (const operation of ['findUnique', 'update', 'delete', 'upsert']) {
      expect(scopeArgs(operation, { where: { id: 'p1' } }, ORG).where).toEqual({
        id: 'p1',
        organizationId: ORG,
      });
    }
    const key = { organizationId_key: { organizationId: ORG, key: 'k' } };
    expect(scopeArgs('findUnique', { where: key }, ORG).where).toEqual({
      ...key,
      organizationId: ORG,
    });
  });

  it('cannot be undone by a filter that names another organisation', () => {
    const args = scopeArgs('findMany', { where: { organizationId: 'other' } }, ORG);
    expect(args.where).toEqual({ organizationId: ORG });
  });

  it('leaves what it is given untouched, and the rest of the arguments alone', () => {
    const where = { id: 'b1' };
    const args = { where, orderBy: { createdAt: 'desc' }, take: 5 };
    expect(scopeArgs('findMany', args, ORG)).toMatchObject({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    expect(where).toEqual({ id: 'b1' });
  });

  it('does not touch a create, which says its own organisation', () => {
    const args = { data: { title: 't', organizationId: ORG } };
    expect(scopeArgs('create', args, ORG)).toEqual(args);
  });
});

describe('assertOwnRows', () => {
  it('lets rows for the organisation through, one or many', () => {
    expect(() => assertOwnRows('create', { data: { organizationId: ORG } }, ORG)).not.toThrow();
    expect(() =>
      assertOwnRows(
        'createMany',
        { data: [{ organizationId: ORG }, { organizationId: ORG }] },
        ORG,
      ),
    ).not.toThrow();
    expect(() =>
      assertOwnRows('createManyAndReturn', { data: { organizationId: ORG } }, ORG),
    ).not.toThrow();
  });

  it('refuses a row for another organisation, or for none', () => {
    expect(() => assertOwnRows('create', { data: { organizationId: 'other' } }, ORG)).toThrow(
      /other than the request/,
    );
    expect(() => assertOwnRows('create', { data: { title: 't' } }, ORG)).toThrow();
    expect(() =>
      assertOwnRows(
        'createMany',
        { data: [{ organizationId: ORG }, { organizationId: 'other' }] },
        ORG,
      ),
    ).toThrow();
  });

  it('checks the create half of an upsert', () => {
    expect(() =>
      assertOwnRows('upsert', { create: { organizationId: ORG }, update: {} }, ORG),
    ).not.toThrow();
    expect(() => assertOwnRows('upsert', { create: { organizationId: 'x' } }, ORG)).toThrow();
  });

  it('ignores reads and updates', () => {
    expect(() => assertOwnRows('findMany', { where: {} }, ORG)).not.toThrow();
    expect(() => assertOwnRows('update', { data: { title: 't' } }, ORG)).not.toThrow();
  });
});

describe('TENANT_MODELS', () => {
  it('leaves out the accounts, memberships, organisations and invitations that span organisations', () => {
    for (const model of [
      'User',
      'Session',
      'Account',
      'Verification',
      'Organization',
      'Membership',
      'Invitation',
    ]) {
      expect(TENANT_MODELS.has(model)).toBe(false);
    }
  });
});
