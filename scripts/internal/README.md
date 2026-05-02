# Internal Development Scripts

This directory contains one-off debugging and testing scripts used during development. These are **not** part of the production application.

## Files

- `patch_products.js` - Development script for patching product data
- `test_products.js` - Manual testing for product queries
- `test_query.js`, `test_query2.js`, `test_query3.js`, `test_query4.js` - Various database query tests
- `test_upload.js` - Testing file upload functionality

## Usage

These scripts are for development and debugging only. They should not be:
- Committed to version control with real data
- Used in production environments
- Relied upon for critical operations

## Recommendation

Consider replacing these with proper unit/integration tests using Jest or similar testing framework.
