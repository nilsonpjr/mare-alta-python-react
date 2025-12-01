import { GoogleGenerativeAI } from "@google/generative-ai";

// Safe access to process.env to prevent ReferenceError in browser environments without polyfills
const apiKey = (typeof process !== 'undefined' && process.env && process.env.VITE_API_KEY) ? process.env.VITE_API_KEY : '';

const genAI = new GoogleGenerativeAI(apiKey);

export const GeminiService = {
  async uploadFile(file: File): Promise<string> {
    if (!apiKey) {
      throw new Error("Configuração de API Key ausente. Não é possível fazer upload.");
    }

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/files:upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.statusText}`);
      }

      const data = await response.json();
      return data.file.uri;
    } catch (error) {
      console.error("Erro no upload do arquivo:", error);
      throw new Error("Erro ao fazer upload do arquivo. Verifique o arquivo e a conexão.");
    }
  },

  async analyzeProblem(boatModel: string, engineModel: string, description: string): Promise<string> {
    if (!apiKey) {
      return "Configuração de API Key ausente. Não é possível realizar análise IA.";
    }

    try {
      const prompt = `
        Atue como um técnico especialista sênior certificado pela Mercury Marine.
        Analise o seguinte problema relatado para criar um pré-diagnóstico.

        Embarcação: ${boatModel}
        Motor: ${engineModel}
        Relato do Cliente: "${description}"

        Por favor, forneça:
        1. Possíveis causas (liste as 3 mais prováveis).
        2. Peças que provavelmente precisarão ser verificadas ou trocadas.
        3. Ações recomendadas para o técnico.

        Responda em formato HTML simples (sem tags html/body, apenas p, ul, li, strong) em Português do Brasil.
        Mantenha o tom profissional e técnico.
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;

      return response.text() || "Não foi possível gerar uma análise.";
    } catch (error) {
      console.error("Erro na análise IA:", error);
      return "Erro ao conectar com o serviço de IA. Verifique sua conexão.";
    }
  },

  async optimizeRoute(locations: string[]): Promise<string> {
    if (!apiKey) {
      return "Sem API Key para otimização.";
    }

    try {
      const prompt = `
        Atue como um gerente de logística. Eu tenho uma equipe técnica que precisa visitar as seguintes marinas/locais hoje:
        ${locations.join(', ')}.

        Considerando que a saída é de Paranaguá (Centro), sugira a ordem de visita mais lógica para economizar tempo e combustível.
        Responda apenas com a lista ordenada numerada e uma breve justificativa de 1 linha.
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;

      return response.text() || "Erro na otimização.";
    } catch (error) {
      return "Erro de conexão IA.";
    }
  }
};
