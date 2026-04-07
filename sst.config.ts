/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "harvestershub",
      removal: input?.stage === "production" || input?.stage === "harvesters" ? "retain" : "remove",
      protect: ["production", "harvesters"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "eu-west-1",
          profile: input?.stage === "harvesters" ? "harvesters" : "default",
          defaultTags: {
            tags: {
              project: "harvestershub",
              stage: input?.stage || "dev",
              app: "harvestershub",
              team: "harvestershub",
              owner: "harvestershub",
              environment: input?.stage || "dev",
              costCenter: "harvestershub",
            },
          },
        },
      },
    };
  },
  async run() {
    const { readdirSync } = await import("fs");
    const infraOutputs = {};

    for (const value of readdirSync("./infra")) {
      const result = await import(`./infra/${value}`);
      if (result.outputs) {
        Object.assign(infraOutputs, result.outputs);
      }
    }

    return {
      outputs: {
        ...infraOutputs,
      },
    };
  },
});
