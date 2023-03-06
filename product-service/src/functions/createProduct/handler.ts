import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import schema from "./schema";
import {
  AWS,
  db,
  ProductsTableName,
  StocksTableName,
} from "src/utils/dynamoDB";
import { Product, Stock } from "../../model/types";

export const putProduct = async (item: Product) => {
  await db
    .put({
      TableName: ProductsTableName,
      Item: item,
    })
    .promise();
  return item.id;
};

export const putStock = async (item: Stock) => {
  return await db
    .put({
      TableName: StocksTableName,
      Item: item,
    })
    .promise();
};

const isDataValid = (data) => {
  if (!data) return false;
  if (!data.title || typeof data.title !== "string") return false;
  if (typeof data.description !== "string") return false;
  if (typeof data.price !== "number") return false;
  if (typeof data.count !== "number") return false;

  return true;
};

export const createProduct: ValidatedEventAPIGatewayProxyEvent<
  typeof schema
> = async (event: any) => {
  try {
    console.log(`Incoming event: ${JSON.stringify(event)}`);
    const data = JSON.parse(event.body);

    if (!isDataValid(data)) {
      formatJSONResponse(400, "Product data is invalid.");
    }

    const id = AWS.util.uuid.v4();

    const product = {
      id: id,
      price: data.price,
      title: data.title,
      description: data.description,
    };

    const stock = {
      product_id: id,
      count: data.count,
    };
    console.log(`created products: ${JSON.stringify(event.body)}`);
    await Promise.all([putProduct(product), putStock(stock)]);
    return formatJSONResponse(200, { ...product, count: stock.count });
  } catch (e) {
    return formatJSONResponse(500, e);
  }
};

export const main = middyfy(createProduct);
