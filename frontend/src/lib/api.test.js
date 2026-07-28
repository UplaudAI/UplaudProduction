const originalBackendUrl = process.env.REACT_APP_BACKEND_URL;

jest.mock(
  "@/lib/business-storage",
  () => ({ clearAuth: jest.fn() }),
  { virtual: true }
);

function loadApiConstant(value) {
  if (value === undefined) {
    delete process.env.REACT_APP_BACKEND_URL;
  } else {
    process.env.REACT_APP_BACKEND_URL = value;
  }
  jest.resetModules();
  return require("./api").API;
}

afterAll(() => {
  if (originalBackendUrl === undefined) {
    delete process.env.REACT_APP_BACKEND_URL;
  } else {
    process.env.REACT_APP_BACKEND_URL = originalBackendUrl;
  }
});

test("uses the same-origin API path when the backend URL is undefined", () => {
  expect(loadApiConstant(undefined)).toBe("/api");
});

test("uses the same-origin API path when the backend URL is empty", () => {
  expect(loadApiConstant("")).toBe("/api");
});

test("removes one trailing slash from an explicit backend URL", () => {
  expect(loadApiConstant("https://preview.example/")).toBe(
    "https://preview.example/api"
  );
});
