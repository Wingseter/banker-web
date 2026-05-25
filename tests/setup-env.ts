// Loaded before any test module — sets the env vars our app refuses
// to boot without. Real DB credentials come from the CI service or
// the developer's local docker container; see tests/helpers/db.ts.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'jest-test-secret-not-for-prod';
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '3307';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'rootpass';
process.env.DB_NAME = process.env.DB_NAME || 'bank';
