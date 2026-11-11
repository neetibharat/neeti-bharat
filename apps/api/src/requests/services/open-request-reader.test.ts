import { describe, expect, it, vi } from 'vitest';
import type { RequestRepository } from '../repositories/request.repository';
import { OpenRequestReader } from './open-request-reader';

describe('OpenRequestReader', () => {
  it('carries who deals with each open request', async () => {
    const repository = {
      findOpen: vi.fn().mockResolvedValue([
        {
          id: 'r1',
          type: 'access',
          personName: 'Ravi',
          status: 'new',
          dueAt: new Date('2099-01-01T00:00:00Z'),
          assigneeId: 'p1',
        },
      ]),
    } as unknown as RequestRepository;
    const [item] = await new OpenRequestReader(repository).open();
    expect(item).toMatchObject({ id: 'r1', assigneeId: 'p1', overdue: false });
  });
});
