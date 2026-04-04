/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "harvesters-hub",
      removal: input?.stage === "production" || input?.stage === "harvesters" ? "retain" : "remove",
      protect: ["production", "harvesters"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "eu-west-1",
          profile: input?.stage === "harvesters" ? "harvesters" : "default",
          defaultTags: {
            tags: {
              project: "harvesters-hub",
              stage: input?.stage || "dev",
              app: "harvesters-hub",
              team: "harvesters-hub",
              owner: "harvesters-hub",
              environment: input?.stage || "dev",
              costCenter: "harvesters-hub",
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
