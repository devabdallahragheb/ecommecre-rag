import { checkMongoConnection, getProducts } from "./mongoClient.js";

async function main() {
  console.log("Checking MongoDB connection...");
  
  try {
    // Test connection
    const isConnected = await checkMongoConnection();
    
    if (isConnected) {
      console.log("✅ MongoDB connection successful!");
      
      // Try to get products count
      try {
        const products = await getProducts();
        console.log(`📦 Found ${products.length} products in the database`);
        
        if (products.length > 0) {
          console.log("📋 Sample product structure:");
          console.log(JSON.stringify(products[0], null, 2));
        }
      } catch (error) {
        console.error("❌ Error fetching products:", error.message);
      }
    } else {
      console.log("❌ MongoDB connection failed!");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main();
