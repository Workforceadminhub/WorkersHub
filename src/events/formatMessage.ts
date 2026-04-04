import { CaseEvent } from "./types";

export function formatEventMessage(event: CaseEvent): { subject: string; html: string } {
  console.log("Formatting event message...", event);
  const { type, caseId, payload } = event;

  switch (type) {
    case "CASE_CREATED":
      return {
        subject: "New Case Created",
        html: `
          <h2>✅ Case Created Successfully</h2>
          <p>
            A new case <strong>${payload.title}</strong> which was filed on <strong>${
          payload?.payload?.dateOfFilling || payload?.dateOfFilling
        }</strong> and case record created on 
            <strong>${payload?.timestamp || event?.timestamp}</strong>.
          </p>
          <p>Case ID: <code>${caseId}</code></p>
        `,
      };
    case "CASE_UPDATED":
      return {
        subject: "Case Updated",
        html: `
          <h2>✏️ Case Details Updated</h2>
          <p> A case <strong>${payload.title}</strong> was updated on 
            <strong>${new Date(
              payload?.timestamp || event?.timestamp,
            ).toLocaleDateString()}</strong>.
          </p>
          <p>Case ID: <code>${caseId}</code></p>
        `,
      };
    case "CASE_ARCHIVED":
      return {
        subject: "Case Archived",
        html: `
          <h2>🗄️ Case Archived</h2>
          <p> The case <strong>${payload.title}</strong> was archived on 
            <strong>${new Date(
              payload?.timestamp || event?.timestamp,
            ).toLocaleDateString()}</strong>.
          </p>
          <p>Case ID: <code>${caseId}</code></p>
        `,
      };
    case "CASE_UNARCHIVED":
      return {
        subject: "Case Unarchived",
        html: `
          <h2>📂 Case Unarchived</h2>
          <p> The case <strong>${payload.title}</strong> was unarchived on 
            <strong>${new Date(
              payload?.timestamp || event?.timestamp,
            ).toLocaleDateString()}</strong>.
          </p>
          <p>Case ID: <code>${caseId}</code></p>
        `,
      };
    case "CLIENT_CREATED":
      return {
        subject: "New Client Added",
        html: `<h2>👤 New Client Created</h2>
          <p>Client <strong>${payload.name}</strong> was added to the system on 
          <strong>${new Date(
            payload?.timestamp || event?.timestamp,
          ).toLocaleDateString()}</strong>.</p>
        `,
      };
    case "CLIENT_UPDATED":
      return {
        subject: "Client Updated",
        html: `<h2>✏️ Client Details Updated</h2>
          <p>Client <strong>${payload.name}</strong> was updated on 
          <strong>${new Date(
            payload?.timestamp || event?.timestamp,
          ).toLocaleDateString()}</strong>.</p>
        `,
      };
    case "CLIENT_ASSIGNED_TO_CASE":
      return {
        subject: "Client Assigned to Case",
        html: `<h2>👤 Client Assigned to Case</h2>
          <p>Client <strong>${payload?.client?.name}</strong> was assigned to case 
          <strong>${payload.title}</strong> on 
          <strong>${new Date(
            payload?.timestamp || event?.timestamp,
          ).toLocaleDateString()}</strong>.</p>
        `,
      };
    case "CLIENT_DELETED":
      return {
        subject: "Client Deleted",
        html: `<h2>🗑️ Client Removed</h2>
          <p>Client with id <strong>${payload?.clientId}</strong> and name <strong>${
          payload?.name
        }</strong> was removed from the system on 
          <strong>${new Date(
            payload?.timestamp || event?.timestamp,
          ).toLocaleDateString()}</strong>.</p>
        `,
      };
    case "STAGE_ACTIVITY_UPDATED":
      return {
        subject: `✅ ${payload.activityName} Completed (${payload.stage} Stage)`,
        html: `
      <h2>✅ ${payload.activityName} Completed</h2>
      <p>
        The activity <strong>${payload.activityName}</strong> in the 
        <strong>${payload.stage}</strong> stage of case 
        <strong>${payload.caseTitle}</strong> has been completed.
      </p>
      ${
        payload.nextActivity
          ? `<p>Next Activity: <strong>${payload.nextActivity}</strong></p>
             ${
               payload?.nextDueDate
                 ? `<p>Due Date: <strong>${new Date(
                     payload.nextDueDate,
                   ).toLocaleDateString()}</strong></p>`
                 : ""
             }`
          : `<p>No further activities are scheduled in this stage.</p>`
      }
      <p><small>Updated on ${new Date(
        payload.completedAt || event.timestamp,
      ).toLocaleString()}</small></p>
    `,
      };

    default:
      return {
        subject: `Case Event: ${type}`,
        html: `
          <h2>ℹ️ Case Event</h2>
          <p>
            Case <strong>${payload.caseTitle ?? caseId}</strong> had an event: <em>${type}</em>.
          </p>
          <pre>${JSON.stringify(payload, null, 2)}</pre>
        `,
      };
  }
}
