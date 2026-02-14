import crypto from 'crypto';

type StoredBlob = {
  data: Buffer;
  mime: string;
  filename: string;
  createdAt: Date;
};

export class BlobStore {
  private static store: Map<string, StoredBlob> = new Map();

  static save(filename: string, mime: string, data: Buffer): string {
    const id = crypto.randomBytes(16).toString('hex');
    this.store.set(id, { data, mime, filename, createdAt: new Date() });
    return id;
  }

  static get(id: string): StoredBlob | undefined {
    return this.store.get(id);
  }
}
