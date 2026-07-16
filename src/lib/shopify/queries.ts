const STORE_PRODUCT_FIELDS = `
  id
  handle
  title
  descriptionHtml
  productType
  vendor
  status
  tags
  createdAt
  updatedAt
  featuredImage {
    url
    altText
  }
  priceRangeV2 {
    minVariantPrice {
      amount
      currencyCode
    }
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  compareAtPriceRange {
    minVariantCompareAtPrice {
      amount
      currencyCode
    }
  }
  media(first: 12) {
    nodes {
      ... on MediaImage {
        id
        image {
          url
          altText
        }
      }
    }
  }
  options {
    name
    values
  }
  variants(first: 50) {
    nodes {
      id
      title
      availableForSale
      price
      compareAtPrice
      sku
      selectedOptions {
        name
        value
      }
      image {
        url
        altText
      }
    }
  }
`;

export const STORE_PRODUCTS_PAGE_QUERY = `
  query StoreProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ${STORE_PRODUCT_FIELDS}
      }
    }
  }
`;

export const STORE_COLLECTION_PRODUCTS_QUERY = `
  query StoreCollectionProducts($handle: String!, $first: Int!, $after: String) {
    collectionByHandle(handle: $handle) {
      id
      handle
      title
      description
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ${STORE_PRODUCT_FIELDS}
        }
      }
    }
  }
`;

export const STORE_PRODUCT_BY_HANDLE_QUERY = `
  query StoreProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      ${STORE_PRODUCT_FIELDS}
    }
  }
`;

export const STORE_RELATED_PRODUCTS_QUERY = `
  query StoreRelated($query: String!, $first: Int!) {
    products(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ${STORE_PRODUCT_FIELDS}
      }
    }
  }
`;

export const STORE_COLLECTIONS_QUERY = `
  query StoreCollections($first: Int!) {
    collections(first: $first, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        description
      }
    }
  }
`;

// Keep home/featured queries lean
const PRODUCT_FIELDS = `
  id
  handle
  title
  productType
  vendor
  status
  tags
  featuredImage {
    url
    altText
  }
  priceRangeV2 {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  compareAtPriceRange {
    minVariantCompareAtPrice {
      amount
      currencyCode
    }
  }
  variants(first: 10) {
    nodes {
      id
      title
      availableForSale
      price
      compareAtPrice
      image {
        url
        altText
      }
    }
  }
`;

export const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true, query: "status:active") {
      nodes {
        ${PRODUCT_FIELDS}
      }
    }
  }
`;

export const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($handle: String!, $first: Int!) {
    collectionByHandle(handle: $handle) {
      id
      handle
      title
      products(first: $first) {
        nodes {
          ${PRODUCT_FIELDS}
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        description
      }
    }
  }
`;

export const VARIANT_QUERY = `
  query Variant($id: ID!) {
    productVariant(id: $id) {
      id
      title
      availableForSale
      price
      image {
        url
        altText
      }
      product {
        title
        featuredImage {
          url
          altText
        }
      }
    }
    shop {
      currencyCode
    }
  }
`;

export const ADMIN_ORDERS_BY_EMAIL = `
  query OrdersByEmail($query: String!) {
    orders(first: 25, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        statusPageUrl
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        fulfillments(first: 1) {
          trackingInfo {
            number
            company
            url
          }
          estimatedDeliveryAt
        }
        lineItems(first: 50) {
          nodes {
            id
            title
            quantity
            sku
            originalUnitPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            image {
              url
            }
          }
        }
      }
    }
  }
`;
