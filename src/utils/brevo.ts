import axios from "axios";
import { Resource } from "sst";

const makeRequestToBrevo = async (endpoint: string, data: Record<string, any>) => {
  const apiKey = process.env.BREVO_API_KEY || Resource.BREVO_API_KEY.value;
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
    console.error("Failed to send templated email:", error);
    throw new Error("Failed to send email through Brevo");
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
    console.error(error);
    throw new Error("Failed to send email");
  }
};
