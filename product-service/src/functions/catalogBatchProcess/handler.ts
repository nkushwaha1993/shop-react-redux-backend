import { SQSEvent } from "aws-lambda";
import { Product } from "../../model/types";
import { putProduct, putStock } from "@functions/createProduct/handler";
import * as AWS from "aws-sdk";
import * as process from "process";
import Ajv from "ajv";
import schema from "@functions/createProduct/schema";

type Response = { batchItemFailures: { itemIdentifier: string }[] };
export const createBatchProcess = async (
  event: SQSEvent
): Promise<Response> => {
  console.log(`Incoming event body: ${JSON.stringify(event.Records)}`);
  const records = event.Records;

  const response: Response = { batchItemFailures: [] };

  const ajv = new Ajv({ coerceTypes: true });
  const validate = ajv.compile(schema);
  const sns = new AWS.SNS({ region: "us-east-1" });

  const promises = records.map(async (record) => {
    const recordBody = JSON.parse(record.body);

    if (!validate(recordBody)) {
      console.log(`Failed to validate product data`);
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
      return;
    }

    try {
      console.log(
        `Creating product ${recordBody.title}: ${JSON.stringify(recordBody)}`
      );
      const { title, description, price, count } = recordBody;

      const product = {
        id: "",
        title,
        description,
        price,
      } as Product;

      const id = await putProduct(product);

      await putStock({ product_id: id, count });

      const params: AWS.SNS.PublishInput = {
        Message: JSON.stringify(product),
        TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
        MessageAttributes: {
          price: {
            DataType: "Number",
            StringValue: product.price.toString(),
          },
        },
      };

      await sns.publish(params).promise();
      console.log(`Sns message sent ${JSON.stringify(params)}`);
    } catch (e) {
      console.log(`Failed to create a product`);
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  });

  await Promise.all(promises);

  return response;
};

export const main = createBatchProcess;
