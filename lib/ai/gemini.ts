import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn("GOOGLE_GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateEmbeddings(textArray: string[]) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const embeddings = await Promise.all(
      textArray.map(async (text) => {
        const result = await model.embedContent(text);
        return result.embedding.values;
      })
    );
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function queryLLM(query: string, context: string) {
  try {
    const prompt = `
    You are a helpful AI assistant that provides accurate information about companies.
    
    Context information is below.
    ---------------------
    ${context}
    ---------------------
    
    Given the context information and not prior knowledge, answer the question: ${query}
    
    If the context doesn't contain relevant information to answer the question, just say "I don't have enough information to answer this question."
    `;
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(prompt);
    return response.response.text();
  } catch (error) {
    console.error("Error querying LLM:", error);
    throw new Error(`Failed to query LLM: ${error instanceof Error ? error.message : String(error)}`);
  }
}
