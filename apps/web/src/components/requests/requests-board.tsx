'use client';

import { REQUEST_STATUSES, type RequestBoardResponse } from '@neeti-bharat/shared';
import { Alert } from '@/components/base/alert/alert';
import { Loading } from '@/components/base/loading/loading';
import { useGetRequestsBoardQuery } from '@/lib/api/requests-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { useNow } from '@/lib/hooks/use-now';
import { BoardColumn } from './board-column';
import { RequestsFrame } from './requests-frame';
import { useSetViewMode } from './requests-view-switch';
import type { RequestView } from './use-request-view';

/** Three columns, new, in progress and done, each with its latest cards. */
function Columns({ data, view }: { data: RequestBoardResponse; view: RequestView }) {
  const now = useNow();
  const setMode = useSetViewMode();
  const { type, q } = view.boardQuery;
  const seeAllClosed = () => {
    view.setTab('done');
    setMode('list');
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      {REQUEST_STATUSES.map((status) => (
        <BoardColumn
          key={status}
          status={status}
          cards={data[status]}
          count={data.counts[status]}
          type={type}
          q={q}
          now={now}
          onSeeAll={status === 'done' ? seeAllClosed : undefined}
        />
      ))}
    </div>
  );
}

/** The board: what is new, in progress and done, with the filters of the page. */
export function RequestsBoard({ view }: { view: RequestView }) {
  const errorMessage = useErrorMessage();
  const { data, error, fulfilledTimeStamp } = useGetRequestsBoardQuery(view.boardQuery);

  if (error) return <Alert tone="error">{errorMessage(error)}</Alert>;
  if (!data) return <Loading />;

  // A new answer from the board replaces any pages added with "Show more", so a column never repeats a card.
  return (
    <RequestsFrame counts={data.counts} view={view} mode="board">
      <Columns key={fulfilledTimeStamp} data={data} view={view} />
    </RequestsFrame>
  );
}
