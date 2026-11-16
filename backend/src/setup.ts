// Setup file for Jest tests
// This runs before each test suite

import "./../config/db.config"; // Import DB config if needed

export const setupTestServer = () => {
  // This will be called in test files that need a running server
  console.log("Test server setup complete");
};