import { put, del, list } from "@vercel/blob";
import { env } from "@/lib/env";

type UploadBody = Parameters<typeof put>[1];

type UploadOptions = Parameters<typeof put>[2];

export async function uploadToBlob(
  pathname: string,
  body: UploadBody,
  options?: Partial<UploadOptions>
) {
  return put(pathname, body, {
    access: "public",
    token: env.BLOB_READ_WRITE_TOKEN,
    ...options
  });
}

export async function deleteFromBlob(urlOrUrls: string | string[]) {
  return del(urlOrUrls, {
    token: env.BLOB_READ_WRITE_TOKEN
  });
}

export async function listBlobs(prefix: string) {
  return list({
    prefix,
    token: env.BLOB_READ_WRITE_TOKEN
  });
}
