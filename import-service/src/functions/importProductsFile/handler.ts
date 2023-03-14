import { middyfy } from "@libs/lambda";
import * as AWS from "aws-sdk";
import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";

export const importProductsFile: ValidatedEventAPIGatewayProxyEvent<
  undefined
> = async (event) => {
  const fileName = event.queryStringParameters.name;
  const params = {
    Bucket: "knowyourlogy-uploads",
    Key: `uploaded/${fileName}`,
    Expires: 60,
    ContentType: "text/csv",
  };
  const s3 = new AWS.S3({ region: "us-east-1" });

  const url = await s3.getSignedUrlPromise("putObject", params);

  return formatJSONResponse({ url });
};

export const main = middyfy(importProductsFile);
