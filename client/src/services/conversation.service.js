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

/*
| Returns { data, pagination } so callers can page through a long sidebar.
| `before` is the nextCursor from the previous page.
*/

export const getConversations = async ({
  limit,
  before,
} = {}) => {
  const params = {};

  if (limit) params.limit = limit;
  if (before) params.before = before;

  const response = await api.get("/conversations", {
    params,
  });

  return {
    data: response.data.data,
    pagination: response.data.pagination || {
      hasMore: false,
      nextCursor: null,
    },
  };
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
