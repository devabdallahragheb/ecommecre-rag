// check-opensearch-auth.js - Simple script to check OpenSearch authentication
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

async function checkOpenSearchAuth() {
  try {
    // Get OpenSearch credentials and endpoint
    const username = process.env.OPENSEARCH_USERNAME;
    const password = process.env.OPENSEARCH_PASSWORD;
    const endpoint = process.env.OPENSEARCH_ENDPOINT;
    const indexName = process.env.OPENSEARCH_INDEX_NAME;
    
    console.log(`OpenSearch credentials - Username: ${username}, Password: ${password ? password.substring(0, 2) + '***' : 'undefined'}`);
    console.log(`OpenSearch endpoint: ${endpoint}`);
    console.log(`OpenSearch index name: ${indexName}`);
    
    // 1. Check if index exists
    const indexUrl = `${endpoint}/${indexName}`;
    console.log(`Checking if index exists at: ${indexUrl}`);
    
    try {
      const indexResponse = await axios.get(
        indexUrl,
        {
          auth: { 
            username, 
            password 
          }
        }
      );
      
      console.log(`Index check successful. Status: ${indexResponse.status}`);
      console.log(`Index exists: ${JSON.stringify(indexResponse.data, null, 2)}`);
    } catch (indexError) {
      console.error(`Index check failed: ${indexError.message}`);
      if (indexError.response) {
        console.error(`Response status: ${indexError.response.status}`);
        console.error(`Response data: ${JSON.stringify(indexError.response.data, null, 2)}`);
      }
    }
    
    // 2. Try a simple search query
    const searchUrl = `${endpoint}/${indexName}/_search`;
    console.log(`\nTrying simple search at: ${searchUrl}`);
    
    try {
      const searchResponse = await axios.post(
        searchUrl,
        { query: { match_all: {} }, size: 1 },
        {
          auth: { 
            username, 
            password 
          },
          headers: { 
            'Content-Type': 'application/json' 
          }
        }
      );
      
      console.log(`Search successful. Status: ${searchResponse.status}`);
      console.log(`Found ${searchResponse.data.hits.total.value} documents`);
      if (searchResponse.data.hits.hits.length > 0) {
        console.log(`First document: ${JSON.stringify(searchResponse.data.hits.hits[0], null, 2)}`);
      }
    } catch (searchError) {
      console.error(`Search failed: ${searchError.message}`);
      if (searchError.response) {
        console.error(`Response status: ${searchError.response.status}`);
        console.error(`Response data: ${JSON.stringify(searchError.response.data, null, 2)}`);
      }
    }
    
    // 3. Try with Authorization header instead of auth option
    console.log(`\nTrying with Authorization header instead of auth option`);
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    
    try {
      const headerResponse = await axios.post(
        searchUrl,
        { query: { match_all: {} }, size: 1 },
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader
          }
        }
      );
      
      console.log(`Header auth successful. Status: ${headerResponse.status}`);
      console.log(`Found ${headerResponse.data.hits.total.value} documents`);
    } catch (headerError) {
      console.error(`Header auth failed: ${headerError.message}`);
      if (headerError.response) {
        console.error(`Response status: ${headerError.response.status}`);
        console.error(`Response data: ${JSON.stringify(headerError.response.data, null, 2)}`);
      }
    }
    
    // 4. Try with curl command
    console.log(`\nCommand to try with curl:`);
    console.log(`curl -X POST "${searchUrl}" -H "Content-Type: application/json" -u "${username}:${password}" -d '{"query":{"match_all":{}},"size":1}'`);
    
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
  }
}

// Run the check
checkOpenSearchAuth()
  .then(() => console.log('Auth check completed'))
  .catch(error => console.error(`Auth check failed: ${error.message}`));
