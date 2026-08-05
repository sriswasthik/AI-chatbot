import api from "./api";

export const sendMessage = async ({
  message,
  provider = "auto",
  model,
}) => {
  const response = await api.post("/chat", {
    message,
    provider,
    model,
  });

  return response.data;
};