const openrouterProvider = {
  name: "openrouter",

  async generate({ message }) {
    return {
      provider: "openrouter",
      model: null,
      content: `[OpenRouter mock] ${message}`,
    };
  },
};

export default openrouterProvider;