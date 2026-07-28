const ENV_NAMES = [
  "REACT_APP_SUPABASE_URL",
  "REACT_APP_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
];

const originalEnv = { ...process.env };
const mockCreateClient = jest.fn(() => ({ auth: {} }));

jest.mock("@supabase/supabase-js", () => ({
  createClient: (...args) => mockCreateClient(...args),
}));

function importSupabase() {
  let loaded;
  jest.isolateModules(() => {
    loaded = require("./supabase");
  });
  return loaded;
}

beforeEach(() => {
  jest.resetModules();
  mockCreateClient.mockClear();
  process.env = { ...originalEnv };
  ENV_NAMES.forEach((name) => delete process.env[name]);
});

afterAll(() => {
  process.env = originalEnv;
});

test("fails clearly when either required CRA Supabase variable is missing", () => {
  process.env.REACT_APP_SUPABASE_URL = "https://example.supabase.co";
  expect(importSupabase).toThrow(/REACT_APP_SUPABASE_PUBLISHABLE_KEY/);

  jest.resetModules();
  delete process.env.REACT_APP_SUPABASE_URL;
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY = "configured-key";
  expect(importSupabase).toThrow(/REACT_APP_SUPABASE_URL/);
});

test("uses only the two CRA-prefixed Supabase variables", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ignored.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "ignored-key";

  expect(importSupabase).toThrow(
    /REACT_APP_SUPABASE_URL.*REACT_APP_SUPABASE_PUBLISHABLE_KEY/
  );

  process.env.REACT_APP_SUPABASE_URL = "https://configured.supabase.co";
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY = "configured-key";

  importSupabase();
  expect(mockCreateClient).toHaveBeenCalledWith(
    "https://configured.supabase.co",
    "configured-key"
  );
});
