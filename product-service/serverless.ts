import type { AWS } from "@serverless/typescript";

import getProductsList from "@functions/getProductsList";
import getProductsById from "@functions/getProductsById";
import createProduct from "@functions/createProduct";
import catalogBatchProcess from "@functions/catalogBatchProcess";

const serverlessConfiguration: AWS = {
  service: "product-service",
  frameworkVersion: "3",
  plugins: [
    "serverless-auto-swagger",
    "serverless-esbuild",
    "serverless-offline",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "us-east-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
    stage: "dev",
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:DescribeTable",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
            ],
            Resource: [
              { "Fn::GetAtt": ["products", "Arn"] },
              { "Fn::GetAtt": ["stocks", "Arn"] },
            ],
          },
          {
            Effect: "Allow",
            Action: "sns:*",
            Resource: { Ref: "createProductTopic" },
          },
        ],
      },
    },
  },
  functions: {
    getProductsById,
    getProductsList,
    createProduct,
    catalogBatchProcess,
  },
  package: {
    individually: true,
  },
  custom: {
    autoswagger: {
      apiType: "http",
      generateSwaggerOnDeploy: false,
      basePath: `/dev/`,
      useStage: false,
      excludeStages: [],
      typefiles: ["./src/model/types.d.ts"],
    },
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
      watch: "./**/*.(js|ts)",
    },
  },
  resources: {
    Resources: {
      products: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          TableName: "products",
        },
      },
      stocks: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "product_id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "product_id",
              KeyType: "HASH",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          TableName: "stocks",
        },
      },
      CatalogItemsQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "catalogItemsQueue",
        },
      },
      createProductTopic: {
        Type: "AWS::SNS::Topic",
        Properties: {
          DisplayName: "Create Product Topic",
          TopicName: "createProductTopic",
        },
      },
      createProductTopicSubscription: {
        Type: "AWS::SNS::Subscription",
        Properties: {
          Endpoint: "neeraj_kushwaha@epam.com",
          Protocol: "email",
          TopicArn: {
            Ref: "createProductTopic",
          },
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
