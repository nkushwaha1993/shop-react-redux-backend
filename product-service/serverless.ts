import type {AWS} from '@serverless/typescript';

 import getProductsList from '@functions/getProductsList';
 import getProductsById from "@functions/getProductsById";

 const stage = process.env.STAGE!;
 console.log({stage});

 const serverlessConfiguration: AWS = {
   service: 'product-service',
   frameworkVersion: '3',
   plugins: [
     'serverless-auto-swagger',
     'serverless-esbuild',
     'serverless-offline'
   ],
   provider: {
     name: 'aws',
     runtime: 'nodejs14.x',
     region: "us-east-1",
     apiGateway: {
       minimumCompressionSize: 1024,
       shouldStartNameWithService: true,
     },
     environment: {
       AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
       NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
     },
   },
   functions: {
     getProductsById,
     getProductsList,
   },
   package: {
     individually: true,
   },
   custom: {
     autoswagger:{
       apiType: 'http',
       generateSwaggerOnDeploy: true,
       basePath: `/dev/`,
       useStage: false,
       excludeStages: [],
       typefiles: ['./src/model/types.d.ts']
     },
     esbuild: {
       bundle: true,
       minify: false,
       sourcemap: true,
       exclude: ['aws-sdk'],
       target: 'node14',
       define: {'require.resolve': undefined},
       platform: 'node',
       concurrency: 10,
       watch: './**/*.(js|ts)',
     },
   },
 };

 module.exports = serverlessConfiguration;