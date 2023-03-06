import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayProxyResult } from "aws-lambda";
import { db, ProductsTableName, StocksTableName } from "src/utils/dynamoDB";

const getProduct = async (id: string) => {
  return await db
    .get({
      TableName: ProductsTableName,
      Key: {
        id,
      },
    })
    .promise();
};

const getStock = async (product_id: string) => {
  return await db
    .get({
      TableName: StocksTableName,
      Key: {
        product_id,
      },
    })
    .promise();
};

export const getProductsById: ValidatedEventAPIGatewayProxyEvent<
  unknown
> = async (event): Promise<APIGatewayProxyResult> => {
  try {
    console.log(`Incoming event: ${JSON.stringify(event)}`);
    const { productId } = event.pathParameters;
    const [product, stock] = await Promise.all([
      getProduct(productId),
      getStock(productId),
    ]);
    if (product.Item && stock.Item) {
      const item = { ...product.Item, count: stock.Item.count || 0 };
      console.log(`getProductById: ${JSON.stringify(item)}`);
      return formatJSONResponse(200, item);
    } else {
      return formatJSONResponse(404, undefined);
    }
  } catch (e) {
    return formatJSONResponse(500, e);
  }
};

export const main = middyfy(getProductsById);
