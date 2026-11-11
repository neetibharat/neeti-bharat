import { describe, expect, it, vi } from 'vitest';
import type { ProfileService } from '../../profile/services/profile.service';
import type { BreachRepository } from '../repositories/breach.repository';
import { OpenBreachReader } from './open-breach-reader';

describe('OpenBreachReader', () => {
  it('carries who deals with each open breach, or nobody', async () => {
    const row = (id: string, assignee: { id: string; name: string } | null) => ({
      id,
      title: `Breach ${id}`,
      foundAt: new Date(),
      peopleAffected: null,
      assignee,
      steps: [{ step: 'found', completedAt: new Date() }],
    });
    const repository = {
      findOpen: vi.fn().mockResolvedValue([row('b1', { id: 'p1', name: 'Ravi' }), row('b2', null)]),
    } as unknown as BreachRepository;
    const profile = {
      list: vi.fn().mockResolvedValue({ entries: [] }),
    } as unknown as ProfileService;
    const items = await new OpenBreachReader(repository, profile).open();
    expect(items.map((item) => [item.id, item.assigneeId])).toEqual([
      ['b1', 'p1'],
      ['b2', null],
    ]);
  });
});
