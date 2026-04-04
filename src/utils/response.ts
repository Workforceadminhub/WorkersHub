export const response = (statusCode: number, message: string) => ({
  statusCode,
  body: JSON.stringify({
    success: statusCode === 200 || statusCode === 201 ? true : false,
    message,
  }),
});
