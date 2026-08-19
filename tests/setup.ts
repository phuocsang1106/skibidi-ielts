const testDatabase = process.env.TEST_DATABASE_URL;
if (testDatabase && process.env.ALLOW_INTEGRATION_TEST_DB === "1") {
  process.env.DATABASE_URL = testDatabase;
}
process.env.SESSION_SECRET ||= "test-session-secret-not-for-production";
process.env.OPENROUTER_MODEL ||= "test/model";
process.env.APP_URL ||= "http://localhost:3000";
