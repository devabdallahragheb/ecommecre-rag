// etl-complete.js - Full ETL process from MongoDB to OpenSearch with embeddings
import { getProducts } from "./mongoClient.js";
import { flattenProductForEmbedding, createProductMetadata } from "./flattenProduct.js";
import { getEmbedding } from "./bedrock.js";
import { storeVector, createIndex } from "./vectorStore.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

async function runETL() {
  console.log("Starting ETL process...");
  
  try {
    // Step 1: Create OpenSearch index
    console.log("Step 1: Creating OpenSearch index...");
    await createIndex();
    
    // Step 2: Get products from MongoDB
    console.log("Step 2: Fetching products from MongoDB...");
    const products = await getProducts();
    
    if (!products || products.length === 0) {
      console.log("No products found in MongoDB");
      return;
    }
    
    console.log(`Processing ${products.length} products...`);
    
    // Step 3: Process each product
    let processed = 0;
    let errors = 0;
    
    for (const product of products) {
      try {
        console.log(`Processing product ${processed + 1}/${products.length}: ${product.name || product._id}`);
        
        // Step 3a: Flatten product data for embedding
        const productText = flattenProductForEmbedding(product);
        
        // Step 3b: Generate embedding using Bedrock
        const embedding = await getEmbedding(productText);
        
        // Step 3c: Create metadata
        const metadata = createProductMetadata(product);
        
        // Step 3d: Store in OpenSearch
        const productId = product._id?.toString() || product.id || `product_${processed}`;
        await storeVector(productId, embedding, metadata);
        
        processed++;
        
        // Add small delay to avoid overwhelming the services
        if (processed % 10 === 0) {
          console.log(`Processed ${processed} products so far...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`Error processing product ${product.name || product._id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\nETL process completed!`);
    console.log(`Successfully processed: ${processed} products`);
    console.log(`Errors: ${errors} products`);
    console.log(`Total products: ${products.length}`);
    
  } catch (error) {
    console.error("ETL process failed:", error);
    process.exit(1);
  }
}

// Run the ETL process if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runETL()
    .then(() => {
      console.log("ETL process finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("ETL process failed:", error);
      process.exit(1);
    });
}

export { runETL };
