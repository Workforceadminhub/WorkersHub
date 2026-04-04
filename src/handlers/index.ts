// import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { Resource } from "sst";

// const s3 = new S3Client({});

// export async function upload() {
//     const command = new PutObjectCommand({
//       Key: crypto.randomUUID(),
//       Bucket: Resource.EproBucket.name,
//     });
  
//     return {
//       statusCode: 200,
//       body: await getSignedUrl(s3, command),
//     };
//   }