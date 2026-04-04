// import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
// import { CaseEvent } from "./types";
// import { Resource } from "sst";

// const client = new EventBridgeClient({ region: "eu-west-1" });

// export const publishCaseEvent = async (event: CaseEvent) => {
//   console.log("Publishing events...");
//   const command = new PutEventsCommand({
//     Entries: [
//       {
//         Source: "harvesters.legal",
//         DetailType: event.type,
//         Detail: JSON.stringify({
//           ...event.payload,
//           actorId: event.actorId,
//           timestamp: event.timestamp,
//           type: event.type,
//           caseId: event.caseId,
//         }),
//         EventBusName: Resource.NotificationBus.name,
//       },
//     ],
//   });
//   const response = await client.send(command);
//   console.log(response);
//   return response;
// };

// export const publishCustomEvent = async (detailType: string, detail: any) => {
//   console.log("Publishing custom event...");
//   const command = new PutEventsCommand({
//     Entries: [
//       {
//         Source: "harvesters.legal",
//         DetailType: detailType,
//         Detail: JSON.stringify(detail),
//         EventBusName: Resource.NotificationBus.name,
//       },
//     ],
//   });
//   const response = await client.send(command);
//   console.log(response);
//   return response;
// };
