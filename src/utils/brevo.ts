import axios, { isAxiosError } from "axios";
import { Resource } from "sst";

function brevoApiKey(): string {
  const fromEnv = process.env.BREVO_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const v = Resource.BREVO_API_KEY.value as string | undefined;
    return typeof v === "string" ? v.trim() : "";
  } catch {
    return "";
  }
}

/** Human-readable detail from Brevo / network errors (for logs and safe client hints). */
export function formatBrevoSendError(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; code?: string } | undefined;
    const msg = typeof data?.message === "string" ? data.message.trim() : "";
    const code = typeof data?.code === "string" ? data.code.trim() : "";
    if (msg || code) return [msg, code].filter(Boolean).join(" — ");
    if (error.response?.status) return `HTTP ${error.response.status}`;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

const makeRequestToBrevo = async (endpoint: string, data: Record<string, any>) => {
  const apiKey = brevoApiKey();
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set (Lambda env or SST secret).");
  }
  const response = await axios({
    method: "POST",
    url: `https://api.brevo.com/v3/${endpoint}`,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    data,
  });
  return response.data;
};


export const sendEmailThroughBrevoTemplate = async ({
  to,
  templateId,
  params,
}: {
  to: string;
  templateId: number;
  params: Record<string, any>;
}) => {
  const data = {
    to: [{ email: to }],
    templateId,
    params, // Much smaller payload - just the dynamic data
  };

  try {
    console.log("Sending templated email:", {
      to,
      templateId,
      paramsSize: JSON.stringify(params).length,
    });
    const response = await makeRequestToBrevo("smtp/email", data);
    return response;
  } catch (error) {
    const detail = formatBrevoSendError(error);
    console.error("[brevo] templated email failed:", detail, error);
    throw new Error(detail ? `Brevo: ${detail}` : "Failed to send email through Brevo");
  }
};

export const sendEmailThroughBrevo = async ({
  to,
  subject,
  htmlContent,
  email,
  name,
}: {
  to: string;
  subject: string;
  htmlContent: string;
  email: string;
  name: string;
}) => {
  const data = {
    to: [{ email: to }],
    subject,
    htmlContent,
    sender: {
      name,
      email: email,
    },
  };
  try {
    const response = await makeRequestToBrevo("smtp/email", data);
    return response;
  } catch (error) {
    const detail = formatBrevoSendError(error);
    console.error("[brevo] smtp/email failed:", detail, error);
    throw new Error(detail ? `Brevo: ${detail}` : "Failed to send email");
  }
};
