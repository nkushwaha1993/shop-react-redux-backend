import type { AWS } from "@serverless/typescript";
import importProductsFile from "@functions/importProductsFile";
import importFileParser from "@functions/importFileParser";

const serverlessConfiguration: AWS = {
  service: "import-service",
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
    stage: "dev",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: "s3:ListBucket",
        Resource: "arn:aws:s3:::knowyourlogy-uploads",
      },
      {
        Effect: "Allow",
        Action: "s3:*",
        Resource: "arn:aws:s3:::knowyourlogy-uploads/*",
      },
      {
        Effect: "Allow",
        Action: ["sqs:SendMessage", "sqs:GetQueueUrl"],
        Resource: "arn:aws:sqs:us-east-1:691449872622:catalogItemsQueue",
      },
      {
        Effect: "Allow",
        Action: ["lambda:InvokeFunction"],
        Resource: "${self:custom.authArn}",
      },
    ],
  },
  // import the function via paths
  functions: { importProductsFile, importFileParser },
  package: { individually: true },
  custom: {
    authArn:
      "arn:aws:lambda:us-east-1:691449872622:function:authorization-service-dev-basicAuthorizer",
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
    autoswagger: {
      apiType: "http",
      generateSwaggerOnDeploy: false,
      basePath: `/dev/`,
      useStage: false,
      excludeStages: [],
      typefiles: ["./src/model/types.d.ts"],
    },
  },
  resources: {
    Resources: {
      GatewayResponse: {
        Type: "AWS::ApiGateway::GatewayResponse",
        Properties: {
          RestApiId: {
            Ref: "ApiGatewayRestApi",
          },
          ResponseType: "DEFAULT_4XX",
          ResponseParameters: {
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'*'",
          },
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
