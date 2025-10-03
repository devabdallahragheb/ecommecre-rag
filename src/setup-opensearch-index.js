// setup-opensearch-index.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

async function setupOpenSearchIndex() {
  try {
    // Get credentials from environment variables
    const username = process.env.OPENSEARCH_USERNAME;
    const password = process.env.OPENSEARCH_PASSWORD;
    const endpoint = process.env.OPENSEARCH_ENDPOINT;
    const indexName = process.env.OPENSEARCH_INDEX_NAME || 'products';
    
    console.log(`Setting up OpenSearch index: ${indexName} at ${endpoint}`);
    
    // Check if index exists
    const indexUrl = `${endpoint}/${indexName}`;
    try {
      const response = await axios.head(indexUrl, {
        auth: { username, password }
      });
      
      console.log(`Index ${indexName} exists with status: ${response.status}`);
      
      // Delete the existing index to recreate with proper mapping
      console.log(`Deleting existing index ${indexName}...`);
      await axios.delete(indexUrl, {
        auth: { username, password }
      });
      console.log(`Index ${indexName} deleted successfully.`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`Index ${indexName} does not exist. Will create it.`);
      } else {
        console.error(`Error checking index: ${error.message}`);
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Data: ${JSON.stringify(error.response.data)}`);
        }
      }
    }
    
    // Create index with proper mapping for knn_vector
    const createIndexBody = {
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
            dimension: 1536, // Titan embedding dimension
            method: {
              name: "hnsw",
              space_type: "cosinesimil",
              engine: "nmslib",
              parameters: {
                ef_construction: 128,
                m: 16
              }
            }
          },
          metadata: {
            type: "object",
            properties: {
              text: { type: "text" },
              productId: { type: "keyword" }
            }
          }
        }
      }
    };
    
    console.log(`Creating index ${indexName} with knn_vector mapping...`);
    const createResponse = await axios.put(
      indexUrl,
      createIndexBody,
      {
        auth: { username, password },
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log(`Index created successfully with status: ${createResponse.status}`);
    console.log(`Response: ${JSON.stringify(createResponse.data)}`);
    
    return {
      success: true,
      message: `OpenSearch index ${indexName} created with knn_vector mapping`
    };
  } catch (error) {
    console.error(`Error setting up OpenSearch index: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the setup function
setupOpenSearchIndex()
  .then(result => {
    console.log(`Setup completed: ${JSON.stringify(result)}`);
    if (result.success) {
      console.log('OpenSearch index is now ready for vector search!');
    } else {
      console.error('Failed to set up OpenSearch index.');
    }
  })
  .catch(error => {
    console.error(`Unexpected error: ${error.message}`);
  });
