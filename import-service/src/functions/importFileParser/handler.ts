import * as AWS from "aws-sdk";
import { S3CreateEvent } from "aws-lambda";
import csvParser from "csv-parser";

const log = (message: string) => {
  console.log(message);
};
export const importFileParser = async (event: S3CreateEvent) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const s3 = new AWS.S3({ region: "us-east-1" });
  const sqs = new AWS.SQS({ region: "us-east-1" });
  const s3Stream = s3
    .getObject({
      Bucket: bucket,
      Key: key,
    })
    .createReadStream();

  s3Stream
    .pipe(csvParser())
    .on("data", async (data) => {
      const message = await JSON.stringify(data);
      await log(message);
      sqs.sendMessage(
        {
          QueueUrl: process.env.SQS_URL,
          MessageBody: message,
        },
        () => {
          console.log("Send message: ", message);
        }
      );
    })
    .on("error", async (error) => {
      await log(error.message);
    })
    .on("end", async () => {
      await log("CSV file processing completed");
    });

  await s3
    .copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: `parsed/${key.split("/").pop()}`,
    })
    .promise();

  await s3
    .deleteObject({
      Bucket: bucket,
      Key: key,
    })
    .promise();

  await log(`File moved from ${key} to parsed/${key}`);
};

export const main = importFileParser;
