'use client';

import type { ProofOverviewResponse } from '@dpdp-kit/shared';
import { Pagination } from '@/components/base/pagination/pagination';
import { ProofTable } from './proof-table';

/** One page of proof as a table, with the page controls under it. */
export function ProofList(props: {
  data: Pick<ProofOverviewResponse, 'items' | 'page' | 'pageSize' | 'total'>;
  onPage: (page: number) => void;
}) {
  const { data } = props;

  return (
    <>
      <ProofTable items={data.items} showControl={false} />
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={props.onPage}
      />
    </>
  );
}
