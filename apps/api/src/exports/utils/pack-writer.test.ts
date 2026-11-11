import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { PackWriter } from './pack-writer';

function collect() {
  const chunks: Uint8Array[] = [];
  const state = { ended: 0, error: undefined as Error | undefined };
  const sink = {
    write: (chunk: Uint8Array) => void chunks.push(chunk),
    end: (error?: Error) => {
      state.ended += 1;
      state.error = error;
    },
  };
  const bytes = () => Uint8Array.from(chunks.flatMap((chunk) => [...chunk]));
  return { sink, state, bytes };
}

describe('PackWriter', () => {
  it('makes a zip with text and file entries, ending once', () => {
    const { sink, state, bytes } = collect();
    const pack = new PackWriter(sink);
    pack.text('notes/readme.txt', 'héllo');
    pack.file('proof/a.bin', Uint8Array.from([1, 2, 3]));
    pack.finish();

    const files = unzipSync(bytes());
    expect(Object.keys(files).sort()).toEqual(['notes/readme.txt', 'proof/a.bin']);
    expect(strFromU8(files['notes/readme.txt']!)).toBe('héllo');
    expect([...files['proof/a.bin']!]).toEqual([1, 2, 3]);
    expect(state).toEqual({ ended: 1, error: undefined });
  });
});
