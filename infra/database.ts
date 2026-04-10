const isProductionLike = $app.stage === "production" || $app.stage === "harvesters";

const vpc = new sst.aws.Vpc("HarvestersHubVpc", {
  az: 2,
});

const database = new sst.aws.Aurora("HarvestersHubDatabase", {
  engine: "postgres",
  vpc,
  dataApi: true,
  scaling: {
        min: "0 ACU",
        max: "2 ACU",
        pauseAfter: "60 minutes",
      },
  dev: {
    username: "postgres",
    password: "password",
    database: "local",
    host: "localhost",
    port: 5432,
  },
});

export const outputs = {
  DB_CLUSTERS_ARN: database.clusterArn,
  DB_SECRET_ARN: database.secretArn,
  DB_NAME: database.database,
};
