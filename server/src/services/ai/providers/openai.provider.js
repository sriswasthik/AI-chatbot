const openaiProvider = {
  name: "openai",

  async generate({ message }) {
    return {
      provider: "openai",
      model: null,
      content: `[OpenAI mock] ${message}`,
    };
  },
};

export default openaiProvider;