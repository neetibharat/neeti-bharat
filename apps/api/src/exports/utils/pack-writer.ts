import { Zip, ZipDeflate, ZipPassThrough } from 'fflate';

/** Where finished zip bytes go. `end` is called once, with an error if the zip could not be completed. */
export interface PackSink {
  write(chunk: Uint8Array): void;
  end(error?: Error): void;
}

/** Builds a zip one entry at a time and hands the bytes on as they are ready, so the pack is never held whole. */
export class PackWriter {
  private readonly zip: Zip;

  constructor(sink: PackSink) {
    this.zip = new Zip((error, chunk, final) => {
      if (error) return sink.end(error);
      sink.write(chunk);
      if (final) sink.end();
    });
  }

  /** Text is squeezed. */
  text(name: string, content: string): void {
    const entry = new ZipDeflate(name, { level: 6 });
    this.zip.add(entry);
    entry.push(new TextEncoder().encode(content), true);
  }

  /** An uploaded file is stored as it is: most are PDFs and images, which do not shrink. */
  file(name: string, content: Uint8Array): void {
    const entry = new ZipPassThrough(name);
    this.zip.add(entry);
    entry.push(content, true);
  }

  finish(): void {
    this.zip.end();
  }
}
