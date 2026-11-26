import type { SearchHit } from '@neeti-bharat/shared';
import { describe, expect, it, vi } from 'vitest';
import type { SearchRepository } from '../repositories/search.repository';
import { SearchService } from './search.service';

const hit = (kind: SearchHit['kind'], id: string): SearchHit => ({ kind, id, title: id });

function build() {
  const repository = {
    policies: vi.fn().mockResolvedValue([hit('policy', 'P01')]),
    proof: vi.fn().mockResolvedValue([hit('proof', 'x1')]),
    vendors: vi.fn().mockResolvedValue([]),
    breaches: vi.fn().mockResolvedValue([]),
    requests: vi.fn().mockResolvedValue([]),
    people: vi.fn().mockResolvedValue([hit('person', 'p1')]),
    rules: vi.fn().mockResolvedValue([hit('rule', 'R6')]),
    controls: vi.fn().mockResolvedValue([hit('control', 'c1')]),
  };
  return { repository, service: new SearchService(repository as unknown as SearchRepository) };
}

describe('SearchService', () => {
  it('asks every kind of record and puts the answers in one list', async () => {
    const { repository, service } = build();
    const { hits } = await service.find('consent');

    for (const ask of Object.values(repository)) expect(ask).toHaveBeenCalledWith('consent');
    expect(hits.map((found) => found.kind)).toEqual([
      'policy',
      'proof',
      'person',
      'rule',
      'control',
    ]);
  });
});
