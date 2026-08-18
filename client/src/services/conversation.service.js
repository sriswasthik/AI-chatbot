import api from "./api";

/*
| Every function returns the unwrapped `data` payload so callers never
| have to reach through the { success, data } envelope. Mismatched
| unwrapping between service and caller is what originally lost the
| conversation id.
*/

export const createConversation = async ({
  title = "New Chat",
  provider = "auto",
} = {}) => {
  const response = await api.post("/conversations", {
    title,
    provider,
  });

  return response.data.data;
};

export const getConversations = async () => {
  const response = await api.get("/conversations");

  return response.data.data;
};

export const getConversation = async (
  conversationId
) => {
  const response = await api.get(
    `/conversations/${conversationId}`
  );

  return response.data.data;
};

export const updateConversation = async (
  conversationId,
  updates
) => {
  const response = await api.patch(
    `/conversations/${conversationId}`,
    updates
  );

  return response.data.data;
};

export const deleteConversation = async (
  conversationId
) => {
  const response = await api.delete(
    `/conversations/${conversationId}`
  );

  return response.data;
};
