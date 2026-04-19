const config = require("../../config/env-config");

class GoogleEmbeddingsService {
  constructor(fields = {}) {
    this.apiKey = fields.apiKey || config.geminiApiKey;
    this.modelName = (fields.modelName || "gemini-embedding-001").replace(
      /^models\//,
      ""
    );
    this.apiVersion = fields.apiVersion || "v1beta";
    this.timeoutMs = fields.timeoutMs || 20000;

    if (!this.apiKey) {
      throw new Error(
        "Google embedding API key is missing. Set GEMINI_API_KEY in environment."
      );
    }
  }

  async embedQuery(text) {
    if (!text || typeof text !== "string") {
      throw new Error("embedQuery requires a non-empty string");
    }

    const data = await this.#requestEmbedding(text);
    const values = data?.embedding?.values;

    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("Google embedding response did not include vector values");
    }

    return values;
  }

  async embedDocuments(documents) {
    if (!Array.isArray(documents)) {
      throw new Error("embedDocuments requires an array of strings");
    }

    const vectors = [];
    for (const document of documents) {
      vectors.push(await this.embedQuery(document));
    }
    return vectors;
  }

  async #requestEmbedding(text) {
    const endpoint = `https://generativelanguage.googleapis.com/${this.apiVersion}/models/${this.modelName}:embedContent?key=${encodeURIComponent(
      this.apiKey
    )}`;

    const body = {
      model: `models/${this.modelName}`,
      content: {
        parts: [{ text }],
      },
    };

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        data = { raw: responseText };
      }

      if (!response.ok) {
        const errorMessage =
          data?.error?.message ||
          `Google embeddings request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}

module.exports = {
  GoogleEmbeddingsService,
};
