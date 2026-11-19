import { Injectable } from '@nestjs/common';
import type { SearchResponse } from '@dpdp-kit/shared';
import { SearchRepository } from '../repositories/search.repository';

@Injectable()
export class SearchService {
  constructor(private readonly repository: SearchRepository) {}

  /** The records whose name, title or contact matches, a few of each kind. */
  async find(q: string): Promise<SearchResponse> {
    const groups = await Promise.all([
      this.repository.policies(q),
      this.repository.proof(q),
      this.repository.vendors(q),
      this.repository.breaches(q),
      this.repository.requests(q),
      this.repository.people(q),
    ]);
    return { hits: groups.flat() };
  }
}
