import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

const endpoint = process.env.OPENSEARCH_ENDPOINT;
const username = process.env.OPENSEARCH_USERNAME;
const password = process.env.OPENSEARCH_PASSWORD;
const indexName = process.env.OPENSEARCH_INDEX_NAME;

const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

export async function storeVector(productId, embedding, metadata) {
  try {
    const document = {
      vector: embedding,
      metadata: metadata,
      timestamp: new Date().toISOString()
    };

    const response = await axios.put(
      `${endpoint}/${indexName}/_doc/${productId}`,
      document,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      }
    );

    console.log(`Stored vector for product ${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error storing vector for product ${productId}:`, error.message);
    throw error;
  }
}

export async function createIndex() {
  try {
    const indexConfig = {
      settings: {
        index: {
          knn: true,
          "knn.algo_param.ef_search": 100
        }
      },
      mappings: {
        properties: {
          vector: {
            type: "knn_vector",
            dimension: 1536, // Amazon Titan embedding dimension
            method: {
              name: "hnsw",
              space_type: "cosinesimil",
              engine: "nmslib"
            }
          },
          metadata: {
            type: "object",
            properties: {
              id: { type: "keyword" },
              name: { type: "text" },
              category: { type: "keyword" },
              brand: { type: "keyword" },
              price: { type: "float" },
              text: { type: "text" }
            }
          },
          timestamp: { type: "date" }
        }
      }
    };

    const response = await axios.put(
      `${endpoint}/${indexName}`,
      indexConfig,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      }
    );

    console.log(`Created OpenSearch index: ${indexName}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response.data?.error?.type === 'resource_already_exists_exception') {
      console.log(`Index ${indexName} already exists`);
      return { acknowledged: true };
    }
    console.error('Error creating index:', error.message);
    throw error;
  }
}

export async function deleteIndex() {
  try {
    const response = await axios.delete(
      `${endpoint}/${indexName}`,
      {
        headers: {
          'Authorization': authHeader
        }
      }
    );

    console.log(`Deleted OpenSearch index: ${indexName}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting index:', error.message);
    throw error;
  }
}

export async function searchVectors(queryVector, size = 5) {
  try {
    const query = {
      size: size,
      query: {
        knn: {
          vector: {
            vector: queryVector,
            k: size
          }
        }
      }
    };

    const response = await axios.post(
      `${endpoint}/${indexName}/_search`,
      query,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      }
    );

    return response.data.hits.hits;
  } catch (error) {
    console.error('Error searching vectors:', error.message);
    throw error;
  }
}
