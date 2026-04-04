export const validateSignUpFields = (body: any) => {
  const requiredFields = ["firstName", "lastName", "email", "password", "hasAcceptedTerms"];

  for (const field of requiredFields) {
    const value = body[field];
    if (value === undefined || value === null || value === "") {
      return `Missing required field: ${field}`;
    }
  }

  if (
    typeof body.firstName !== "string" ||
    typeof body.lastName !== "string" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return "firstName, lastName, email, and password must be strings.";
  }

  //email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return "Invalid email format.";
  }

  if (body.password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).+$/;
  if (!passwordRegex.test(body.password)) {
    return "Password must contain at least one uppercase letter, one number, and one special character.";
  }

  if (body.hasAcceptedTerms !== true) {
    return "You must accept the terms.";
  }

  return null; // No errors
};

export const validateVerifyOTPFields = (body: any) => {
  const requiredFields = ["email", "otp"];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      return `Missing required field: ${field}`;
    }
  }

  return null; // No errors
};

const isValidDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

export const validateCaseCreationFields = (body: any) => {
  const requiredFields = ["title", "dateOfFilling"];

  const dateFields = ["dateOfFilling"];

  for (const field of requiredFields) {
    const value = body[field];

    if (value === undefined || value === null || value === "") {
      return `Missing required field: ${field}`;
    }

    if (dateFields.includes(field)) {
      if (typeof value !== "string" || !isValidDate(value)) {
        return `Invalid date format for field: ${field}`;
      }
    } else {
      if (typeof value !== "string") {
        return `Invalid type for field: ${field}. Expected string.`;
      }
    }
  }

  return null; // Validation passed
};
export const validateClientCreationFields = (body: any) => {
  const requiredFields = ["name"];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (body.email && !emailRegex.test(body.email)) {
    return "Invalid email format.";
  }

  const phoneNumberRegex = /^(?:\+234|234|0)\d{10}$/;

  if (body.phoneNumber && !phoneNumberRegex.test(body.phoneNumber)) {
    return "Invalid phone number format.";
  }

  for (const field of requiredFields) {
    const value = body[field];

    if (value === undefined || value === null || value === "") {
      return `Missing required field: ${field}`;
    }
  }

  return null;
};

export const validatePleadingsInput = (data: any) => {
  const errors: string[] = [];

  if (data.serviceDate && isNaN(Date.parse(data.serviceDate))) {
    errors.push("Invalid serviceDate.");
  }

  if (data.replyDate && isNaN(Date.parse(data.replyDate))) {
    errors.push("Invalid replyDate.");
  }

  if (data.pleadingsClosedDate && isNaN(Date.parse(data.pleadingsClosedDate))) {
    errors.push("Invalid pleadingsClosedDate.");
  }

  if (data.originatingRespType && typeof data.originatingRespType !== "string") {
    errors.push("originatingRespType must be a string.");
  }

  if (data.counterClaimResp && typeof data.counterClaimResp !== "string") {
    errors.push("counterClaimResp must be a string.");
  }

  if (data.hasClosed !== undefined && typeof data.hasClosed !== "boolean") {
    errors.push("hasClosed must be a boolean.");
  }

  return errors;
};

export const validateCMCInput = (data: any) => {
  const errors: string[] = [];

  if (data.pleadingsClosedDate && isNaN(Date.parse(data.pleadingsClosedDate))) {
    errors.push("Invalid pleadingsClosedDate.");
  }

  if (data.form17And18Date && isNaN(Date.parse(data.form17And18Date))) {
    errors.push("Invalid form17And18Date.");
  }

  if (data.issuesDate && isNaN(Date.parse(data.issuesDate))) {
    errors.push("Invalid issuesDate.");
  }

  if (data.conferenceClosedDate && isNaN(Date.parse(data.conferenceClosedDate))) {
    errors.push("Invalid conferenceClosedDate.");
  }

  if (data.hasClosed !== undefined && typeof data.hasClosed !== "boolean") {
    errors.push("hasClosed must be a boolean.");
  }

  return errors;
};

export const validateTrialInput = (data: any) => {
  const errors: string[] = [];
  if (data.trialStartDate && isNaN(Date.parse(data.trialStartDate)))
    errors.push("Invalid trialStartDate.");

  if (data.trialCloseDate && isNaN(Date.parse(data.trialCloseDate)))
    errors.push("Invalid trialCloseDate.");

  if (data.finalAddressServedDate && isNaN(Date.parse(data.finalAddressServedDate)))
    errors.push("Invalid finalAddressServedDate.");

  if (data.replyServedDate && isNaN(Date.parse(data.replyServedDate)))
    errors.push("Invalid replyServedDate.");

  return errors;
};

export const validateProfileUpdateFields = (data: any) => {
  const errors: string[] = [];
  if (data.firstName && typeof data.firstName !== "string")
    errors.push("firstName must be a string.");

  if (data.lastName && typeof data.lastName !== "string") errors.push("lastName must be a string.");

  if (data.state && typeof data.state !== "string") errors.push("state must be a string.");

  if (data.nationality && typeof data.nationality !== "string")
    errors.push("Nationality must be a string.");

  return errors;
};

export const validatePasswordChange = (data: any) => {
  const requiredFields = ["oldPassword", "newPassword"];
  const errors: string[] = [];

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors.push(`${field} is required.`);
    }
  });

  // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  // if (data.newPassword && !passwordRegex.test(data.newPassword)) {
  //   errors.push("newPassword must be at least 8 characters long and contain at least one letter and one number.");
  // }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).+$/;
  if (!passwordRegex.test(data.newPassword)) {
    errors.push(
      "Password must contain at least one uppercase letter, one number, and one special character.",
    );
  }

  return errors;
};

export const validateCaseUpdateInput = (data: any) => {
  const errors: string[] = [];

  const validFields = [
    "courtType",
    "caseType",
    "representingParty",
    "commencementForm",
    "title",
    "suitAppealNumber",
    "bailiffName",
    "judgeName",
    "dateOfFilling",
    "dateOfCommencement",
    "startDate",
    "endDate",
    "status",
    "clientId"
  ];
  Object.keys(data).forEach((key) => {
    if (!validFields.includes(key)) {
      errors.push(`Field ${key} does not exist.`);
    }
  });

  if (data.courtType && typeof data.courtType !== "string") {
    errors.push("courtType must be a string.");
  }

  if (data.caseType && typeof data.caseType !== "string") {
    errors.push("caseType must be a string.");
  }

  if (data.representingParty && typeof data.representingParty !== "string") {
    errors.push("representingParty must be a string.");
  }

  if (data.commencementForm && typeof data.commencementForm !== "string") {
    errors.push("commencementForm must be a string.");
  }

  if (data.title && typeof data.title !== "string") {
    errors.push("title must be a string.");
  }

  if (data.suitAppealNumber && typeof data.suitAppealNumber !== "string") {
    errors.push("suitAppealNumber must be a string.");
  }

  if (data.bailiffName && typeof data.bailiffName !== "string") {
    errors.push("bailiffName must be a string.");
  }

  if (data.judgeName && typeof data.judgeName !== "string") {
    errors.push("judgeName must be a string.");
  }

  if (data.dateOfFilling && isNaN(Date.parse(data.dateOfFilling))) {
    errors.push("Invalid dateOfFilling.");
  }

  if (data.dateOfCommencement && isNaN(Date.parse(data.dateOfCommencement))) {
    errors.push("Invalid dateOfCommencement.");
  }

  if (data.startDate && isNaN(Date.parse(data.startDate))) {
    errors.push("Invalid startDate.");
  }

  if (data.endDate && isNaN(Date.parse(data.endDate))) {
    errors.push("Invalid endDate.");
  }

  if (data.status && typeof data.status !== "string") {
    errors.push("status must be a string.");
  }

  return errors;
};

export const validateClientUpdateInput = (data: any) => {
  const errors: string[] = [];

  // check if data is in fields if not column does not exists error
  const validFields = ["name", "email", "phoneNumber", "nationality", "state", "address"];
  Object.keys(data).forEach((key) => {
    if (!validFields.includes(key)) {
      errors.push(`Field ${key} does not exist.`);
    }
  });

  if (data.name && typeof data.name !== "string") {
    errors.push("name must be a string.");
  }

  if (data.email && typeof data.email !== "string") {
    errors.push("email must be a string.");
  }

  if (data.phoneNumber && typeof data.phoneNumber !== "string") {
    errors.push("phoneNumber must be a string.");
  }

  if (data.address && typeof data.address !== "string") {
    errors.push("address must be a string.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Invalid email format.");
  }

  const phoneNumberRegex = /^(?:\+234|234|0)\d{10}$/;

  if (data.phoneNumber && !phoneNumberRegex.test(data.phoneNumber)) {
    errors.push("Invalid phone number format.");
  }

  return errors;
};
