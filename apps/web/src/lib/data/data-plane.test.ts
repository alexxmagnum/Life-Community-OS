import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  isProductionDataPlane,
} from "./data-plane";

describe("data plane", () => {
  it("forbids file persistence in production", () => {
    assert.equal(
      isFilePersistenceAllowed({ NODE_ENV: "production" }),
      false,
    );
    assert.equal(isProductionDataPlane({ NODE_ENV: "production" }), true);
  });

  it("forbids file persistence when auth is required", () => {
    assert.equal(
      isFilePersistenceAllowed({
        NODE_ENV: "development",
        LCOS_AUTH_REQUIRED: "true",
      }),
      false,
    );
  });

  it("allows file fixtures in development without auth cutover", () => {
    assert.equal(
      isFilePersistenceAllowed({ NODE_ENV: "development" }),
      true,
    );
  });

  it("detects service database configuration", () => {
    assert.equal(isDatabaseConfigured({}), false);
    assert.equal(
      isDatabaseConfigured({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
      }),
      true,
    );
  });
});
