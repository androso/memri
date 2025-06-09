// Re-export everything from the models for backward compatibility
export * from "./models";

// For backward compatibility, also export as the main storage
export { storage, checkDatabaseHealth } from "./models";