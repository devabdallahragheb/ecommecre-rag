// working-server.js - Server with direct OpenSearch authentication that works
import express from "express";
import { getEmbedding, generateAnswer } from "./bedrock.js";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

const app = express();
app.use(express.json());

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`Processing question: "${question}"`);

    // 1. Embed question
    console.log("Generating embedding for question...");
    const qEmbedding = await getEmbedding(question);
    console.log("Embedding generated successfully, length:", qEmbedding.length);

    // 2. Query OpenSearch directly
    let results;
    try {
      // Get OpenSearch credentials and endpoint
      const username = process.env.OPENSEARCH_USERNAME;
      const password = process.env.OPENSEARCH_PASSWORD;
      const endpoint = process.env.OPENSEARCH_ENDPOINT;
      const indexName = process.env.OPENSEARCH_INDEX_NAME;
      
      console.log(`OpenSearch endpoint: ${endpoint}`);
      console.log(`OpenSearch index name: ${indexName}`);
      
      const searchUrl = `${endpoint}/${indexName}/_search`;
      console.log(`Querying OpenSearch at: ${searchUrl}`);
      
      // Construct the k-NN query
      const knnQuery = {
        size: 5,
        query: {
          knn: {
            vector: {
              vector: qEmbedding,
              k: 5
            }
          }
        }
      };
      
      // Make the OpenSearch query with Authorization header
      console.log("Sending query to OpenSearch with Authorization header...");
      const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
      
      const response = await axios.post(
        searchUrl,
        knnQuery,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader
          }
        }
      );
      
      results = response.data.hits.hits;
      console.log(`Found ${results.length} relevant products.`);
    } catch (error) {
      console.error('OpenSearch query failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      return res.status(500).json({ 
        error: "Failed to query product database", 
        details: error.message 
      });
    }
    
    // 3. Prepare context
    let context = "No relevant product information found.";
    if (results && results.length > 0) {
      context = results.map(r => r._source?.metadata?.text || "No product text available").join("\n\n");
      console.log("Context prepared from relevant products.");
    } else {
      console.log("No relevant products found in OpenSearch.");
    }

    // 4. Generate answer using Bedrock
    console.log("Generating answer using Bedrock...");
    const prompt = `You are a helpful product assistant. Answer the following question based on the product information provided.

Product Information:
${context}

Question: ${question}

Provide a helpful, accurate answer based only on the product information above. If the information doesn't contain relevant details to answer the question, politely say so.`;
    
    try {
      const answer = await generateAnswer(prompt);
      console.log("Answer generated successfully.");
      res.json({ answer });
    } catch (error) {
      console.error('Answer generation failed:', error.message);
      res.status(500).json({ 
        error: "Failed to generate answer", 
        details: error.message,
        context: context // Include context so client can still use it
      });
    }
  } catch (err) {
    console.error('Unexpected error in /ask endpoint:', err);
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start the server
const PORT = 7000;
app.listen(PORT, () => console.log(`RAG API running at http://localhost:${PORT}`));
