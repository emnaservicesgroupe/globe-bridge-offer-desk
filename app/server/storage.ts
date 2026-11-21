import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function storage() {
  const { CLOUDFLARE_ACCOUNT_ID: account, R2_BUCKET_NAME: bucket, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey } = process.env;
  if (!account || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Configure the existing private R2 bucket.");
  const client = new S3Client({
    endpoint: `https://${account}.r2.cloudflarestorage.com`, region: "auto", forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey }, requestChecksumCalculation: "WHEN_REQUIRED",
  });
  return { client, bucket };
}

export const limits = { file: 10 * 1024 * 1024, video: 20 * 1024 * 1024 };
export type MediaKind = keyof typeof limits;

export async function uploadTicket(kind: MediaKind, size: number) {
  const { client, bucket } = storage();
  const key = "staging/" + kind + "/" + crypto.randomUUID();
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentLength: size });
  return { key, url: await getSignedUrl(client, command, { expiresIn: 300 }) };
}

export async function readUpload(kind: MediaKind, key: string, name: string) {
  if (!new RegExp("^staging/" + kind + "/[a-f0-9-]{36}$").test(key) || !name || name.length > 255)
    throw new Error("Invalid upload reference.");
  const { client, bucket } = storage();
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body || !result.ContentLength || result.ContentLength > limits[kind]) {
    throw new Error("Invalid attachment size.");
  }
  const bytes = await result.Body.transformToByteArray();
  return new File([new Uint8Array(bytes).buffer], name);
}

export async function saveObject(key: string, file: File, contentType: string) {
  const { client, bucket } = storage();
  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: new Uint8Array(await file.arrayBuffer()), ContentType: contentType,
  }));
}

export async function removeObject(key: string) {
  const { client, bucket } = storage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function downloadUrl(key: string, pdf = false) {
  const { client, bucket } = storage();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket, Key: key, ResponseCacheControl: "private, no-store",
    ...(pdf ? { ResponseContentDisposition: 'attachment; filename="offer-letter.pdf"', ResponseContentType: "application/pdf" } : {}),
  }), { expiresIn: pdf ? 300 : 1800 });
}
