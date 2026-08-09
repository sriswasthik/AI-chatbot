import api from "./api";

export const sendMessage = async ({
  message,
  provider = "auto",
  model,
  conversationId = null,
}) => {
  const payload = {
    message,
    provider,
    model,
    conversationId,
  };

  console.log(
    "CHAT REQUEST PAYLOAD:",
    payload
  );

  const response = await api.post(
    "/chat",
    payload,
    {
      params: conversationId
        ? {
            conversationId,
          }
        : {},
    }
  );

  console.log(
    "CHAT RESPONSE:",
    response.data
  );

  return response.data;
};