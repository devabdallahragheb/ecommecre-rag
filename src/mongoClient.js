import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to look for .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../", ".env") });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function getProducts() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const database = client.db(process.env.MONGODB_DATABASE || "ecommerce");
    const collection = database.collection(process.env.MONGODB_COLLECTION || "products");
    
    const products = await collection.find({}).toArray();
    console.log(`Retrieved ${products.length} products from MongoDB`);
    
    return products;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  } finally {
    await client.close();
  }
}

export async function checkMongoConnection() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connection successful!");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    return false;
  } finally {
    await client.close();
  }
}
