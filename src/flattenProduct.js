export function flattenProductForEmbedding(product) {
  // Extract key product information for embedding
  const parts = [];
  
  if (product.name) parts.push(`Product: ${product.name}`);
  if (product.description) parts.push(`Description: ${product.description}`);
  if (product.category) parts.push(`Category: ${product.category}`);
  if (product.brand) parts.push(`Brand: ${product.brand}`);
  if (product.price) parts.push(`Price: $${product.price}`);
  if (product.features && Array.isArray(product.features)) {
    parts.push(`Features: ${product.features.join(', ')}`);
  }
  if (product.specifications) {
    const specs = Object.entries(product.specifications)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    parts.push(`Specifications: ${specs}`);
  }
  if (product.tags && Array.isArray(product.tags)) {
    parts.push(`Tags: ${product.tags.join(', ')}`);
  }
  
  return parts.join('\n');
}

export function createProductMetadata(product) {
  return {
    id: product._id?.toString() || product.id,
    name: product.name,
    category: product.category,
    brand: product.brand,
    price: product.price,
    text: flattenProductForEmbedding(product)
  };
}
