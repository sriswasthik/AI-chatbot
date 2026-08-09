import api from "./api";

export const createConversation = async ({
  title = "New Chat",
  provider = "auto",
} = {}) => {
  const response = await api.post(
    "/conversations",
    {
      title,
      provider,
    }
  );

  return response.data;
};

export const getConversations = async () => {
  const response = await api.get(
    "/conversations"
  );

  return response.data;
};

export const getConversation = async (
  conversationId
) => {
  const response = await api.get(
    `/conversations/${conversationId}`
  );

  return response.data;
};

export const updateConversation = async (
  conversationId,
  updates
) => {
  const response = await api.patch(
    `/conversations/${conversationId}`,
    updates
  );

  return response.data;
};

export const deleteConversation = async (
  conversationId
) => {
  const response = await api.delete(
    `/conversations/${conversationId}`
  );

  return response.data;
};