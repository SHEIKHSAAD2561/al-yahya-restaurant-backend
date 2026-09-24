import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, initializeApp, deleteApp, cert } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';

const DOWNLOAD_TOKEN_METADATA_KEY = 'firebaseStorageDownloadTokens';

/**
 * Thin wrapper around the Firebase Admin SDK's Cloud Storage client, shared
 * by any feature that uploads a file (currently only the company logo).
 *
 * URLs match the Firebase client SDK's own `getDownloadURL()` format
 * (firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=<token>)
 * rather than a plain GCS public-ACL URL, for two reasons: it's the existing
 * convention already used elsewhere in this Firebase project, and newer
 * buckets have "uniform bucket-level access" on by default, which rejects
 * the ACL-based `file.makePublic()` call entirely.
 */
@Injectable()
export class FirebaseStorageService implements OnModuleDestroy {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private readonly app: App;
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('FIREBASE_STORAGE_BUCKET')!;

    this.app = initializeApp({
      credential: cert({
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID')!,
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL')!,
        // .env stores the PEM with literal "\n" sequences; real newlines are required here.
        privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n'),
      }),
      storageBucket: this.bucketName,
    });
    this.storage = getStorage(this.app);
  }

  private downloadUrl(path: string, token: string): string {
    return `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  }

  /** Uploads a buffer and returns its download URL. `path` is the object key,
   * e.g. `company/<uuid>.png` — callers own their own folder convention. */
  async uploadFile(buffer: Buffer, path: string, contentType: string): Promise<string> {
    const token = randomUUID();
    const file = this.storage.bucket().file(path);
    await file.save(buffer, {
      metadata: { contentType, metadata: { [DOWNLOAD_TOKEN_METADATA_KEY]: token } },
    });
    return this.downloadUrl(path, token);
  }

  /** Deletes an object by its download URL (as returned by `uploadFile`), or a
   * no-op if the URL doesn't point at this bucket or the object is already gone. */
  async deleteByDownloadUrl(downloadUrl: string): Promise<void> {
    const prefix = `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/`;
    if (!downloadUrl.startsWith(prefix)) return;

    const encodedPath = downloadUrl.slice(prefix.length).split('?')[0];
    const path = decodeURIComponent(encodedPath);
    await this.storage
      .bucket()
      .file(path)
      .delete()
      .catch((error: unknown) => {
        this.logger.warn(`Could not delete storage object ${path}: ${String(error)}`);
      });
  }

  onModuleDestroy(): Promise<void> {
    return deleteApp(this.app);
  }
}
