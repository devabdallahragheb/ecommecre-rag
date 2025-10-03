import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

// Initialize the Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Embedding model ID - Amazon Titan Embeddings
const EMBEDDING_MODEL = "amazon.titan-embed-text-v1";

// Text generation model ID - Anthropic Claude 2.1
const TEXT_MODEL = "anthropic.claude-v2:1";

// Maximum text length for Bedrock embedding models
// Titan has a token limit of 8,192 tokens, which is roughly 12,000-16,000 characters
// Using a conservative estimate to ensure we stay under the limit
const MAX_TEXT_LENGTH = 8000; // Conservative character limit to stay under token limit

export async function getEmbedding(text) {
  try {
    // Truncate text if it exceeds the maximum length
    const truncatedText = text.length > MAX_TEXT_LENGTH 
      ? text.substring(0, MAX_TEXT_LENGTH) 
      : text;
    
    if (text.length > MAX_TEXT_LENGTH) {
      console.log(`Text truncated from ${text.length} to ${truncatedText.length} characters`);
    }
    
    console.log(`Getting embedding for text: ${truncatedText.substring(0, 50)}...`);
    
    // Titan embedding model requires inputText in the body
    const command = new InvokeModelCommand({
      modelId: EMBEDDING_MODEL,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: truncatedText
      }),
    });
    
    const response = await bedrockClient.send(command);
    
    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("Embedding generated successfully");
    
    // Titan model returns embedding directly
    return responseBody.embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

export async function generateAnswer(prompt) {
  try {
    console.log(`Generating answer for prompt: ${prompt.substring(0, 50)}...`);
    
    // Claude 2.1 specific payload format
    const payload = {
      prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 500,
      temperature: 0.7,
      top_k: 250,
      top_p: 0.999,
      stop_sequences: ["\n\nHuman:"] 
    };
    
    const command = new InvokeModelCommand({
      modelId: TEXT_MODEL,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });
    
    const response = await bedrockClient.send(command);
    
    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("Answer generated successfully");
    
    // Claude 2.1 returns completion in the response
    return responseBody.completion || "No answer generated.";
  } catch (error) {
    console.error("Error generating answer:", error);
    throw error;
  }
}
