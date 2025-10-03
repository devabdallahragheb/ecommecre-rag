# E-commerce RAG Application

A Retrieval-Augmented Generation (RAG) application for e-commerce product queries using MongoDB, AWS Bedrock, and OpenSearch.

## Architecture

```
MongoDB → ETL Pipeline → AWS Bedrock (Embeddings) → OpenSearch → RAG Server
```

## Features

- **Product Data Extraction**: Retrieves product data from MongoDB
- **Vector Embeddings**: Uses AWS Bedrock (Amazon Titan) for generating embeddings
- **Vector Search**: Stores and searches vectors in OpenSearch/Elasticsearch
- **Natural Language Queries**: Answers product questions using Claude 2.1
- **Complete ETL Pipeline**: Full data processing from MongoDB to OpenSearch

## Project Structure

```
src/
├── working-server.js      # Main RAG server
├── bedrock.js            # AWS Bedrock integration
├── etl-complete.js       # Complete ETL pipeline
├── mongoClient.js        # MongoDB connection
├── flattenProduct.js     # Product data transformation
├── vectorStore.js        # OpenSearch operations
├── checkMongo.js         # MongoDB connection checker
├── setup-opensearch-index.js  # Index setup
└── check-opensearch-auth.js   # Auth checker
```

## Prerequisites

- Node.js 18+
- MongoDB instance with product data
- AWS Account with Bedrock access
- OpenSearch/Elasticsearch cluster

## Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=ecommerce
MONGODB_COLLECTION=products

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# OpenSearch
OPENSEARCH_ENDPOINT=https://your-opensearch-domain.region.es.amazonaws.com
OPENSEARCH_USERNAME=your_username
OPENSEARCH_PASSWORD=your_password
OPENSEARCH_INDEX_NAME=products-vector-index
```

## Installation

1. Clone the repository:
```bash
git clone git@github.com:devabdallahragheb/ecommecre-rag.git
cd ecommecre-rag
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

## Usage

### 1. Check MongoDB Connection
```bash
npm run check-mongo
```

### 2. Setup OpenSearch Index
```bash
npm run setup-index
```

### 3. Run ETL Pipeline
```bash
npm run etl
```

### 4. Start RAG Server
```bash
npm start
```

The server will start on `http://localhost:7000`

## API Endpoints

### POST /ask
Ask questions about products

**Request:**
```json
{
  "question": "What are the best laptops under $1000?"
}
```

**Response:**
```json
{
  "answer": "Based on the product information, here are the best laptops under $1000..."
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## ETL Pipeline

The ETL pipeline processes product data through these steps:

1. **Extract**: Retrieves products from MongoDB
2. **Transform**: Flattens product data for embedding
3. **Embed**: Generates vectors using AWS Bedrock Titan
4. **Load**: Stores vectors in OpenSearch with metadata

## Technologies Used

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Product data storage
- **AWS Bedrock**: AI/ML services (Titan embeddings, Claude 2.1)
- **OpenSearch**: Vector search engine
- **Axios**: HTTP client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License
