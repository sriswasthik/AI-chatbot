import api from "./api";

/*
|--------------------------------------------------------------------------
| Send a chat message
|--------------------------------------------------------------------------
|
| conversationId is null for the first message of a new chat and carries
| the active id for every message after that. It travels in the request
| BODY only -- it used to be duplicated into the query string, which meant
| two contracts to keep in sync and one more place for it to go missing.
|
| Returns the unwrapped payload:
|   { conversationId, content, provider, model, latencyMs }
*/

export const sendMessage = async ({
  message,
  provider = "auto",
  model,
  conversationId = null,
}) => {
  const payload = {
    message,
    provider,
    conversationId: conversationId || null,
  };

  /*
  | Only send `model` when one was actually chosen -- an undefined value
  | is dropped by JSON.stringify anyway, and the schema treats the field
  | as optional rather than nullable.
  */

  if (model) {
    payload.model = model;
  }

  const response = await api.post("/chat", payload);

  return response.data.data;
};
