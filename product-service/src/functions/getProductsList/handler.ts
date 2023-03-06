import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayProxyResult } from "aws-lambda";
import { db,ProductsTableName,StocksTableName } from 'src/utils/dynamoDB';

const getProducts = async () => {
  return await db
    .scan({
      TableName: ProductsTableName,
    })
    .promise();
};

const getStocks = async () => {
  return await db
    .scan({
      TableName: StocksTableName,
    })
    .promise();
};

const mergeResults = (productItems, stockItems) => {
  const productsMap = new Map();

  productItems.forEach((product) => {
    const id = product.id;
    productsMap.set(id, product);
  });

  stockItems.forEach((stock) => {
    const id = stock.product_id;
    const item = productsMap.get(id);
    if (item) {
      item.count = stock.count;
      productsMap.set(id, item);
    }
  });

  return Array.from(productsMap.values());
};

export const getProductsList: ValidatedEventAPIGatewayProxyEvent<
  unknown
> = async (): Promise<APIGatewayProxyResult> => {
  try {
    const [products, stocks] = await Promise.all([getProducts(), getStocks()]);
    const items = mergeResults(products.Items, stocks.Items);

    return formatJSONResponse(200, items);
  } catch (e) {
    return formatJSONResponse(500, e);
  }
};

export const main = middyfy(getProductsList);
