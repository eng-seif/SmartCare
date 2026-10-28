import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { test } from "node:test";

const healthRequire = createRequire(new URL("../../artifacts/fathalla-health/package.json", import.meta.url));
const apiRequire = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url));
const formRequire = createRequire(new URL("../../artifacts/mockup-sandbox/package.json", import.meta.url));
const expressRequire = createRequire(apiRequire.resolve("express"));
const nextRequire = createRequire(healthRequire.resolve("next"));
const hooksRequire = createRequire(
  createRequire(healthRequire.resolve("eslint-config-next")).resolve("eslint-plugin-react-hooks"),
);

function atLeast(actual: string, minimum: string) {
  const parts = actual.split(".").map(Number);
  const floor = minimum.split(".").map(Number);
  const difference = parts.map((part, index) => part - floor[index]).find((value) => value !== 0) ?? 0;
  assert.ok(difference >= 0, `${actual} must be at least ${minimum}`);
}

test("runtime and lint dependency chains use patched releases", () => {
  atLeast(healthRequire("next/package.json").version, "16.4.1");
  atLeast(nextRequire("sharp").versions.sharp, "0.35.5");
  atLeast(expressRequire("body-parser/package.json").version, "2.4.0");
  atLeast(expressRequire("qs/package.json").version, "6.16.1");
  atLeast(formRequire("zod/package.json").version, "4.6.6");
  atLeast(hooksRequire("zod/package.json").version, "4.6.6");
});

test("Zod 4 form resolver accepts valid values and reports invalid fields", async () => {
  const { z } = formRequire("zod");
  const { zodResolver } = formRequire("@hookform/resolvers/zod");
  const resolver = zodResolver(z.object({ name: z.string().min(1) }));
  const options = { fields: {}, shouldUseNativeValidation: false };
  assert.deepEqual(await resolver({ name: "Valid" }, {}, options), {
    values: { name: "Valid" }, errors: {},
  });
  const invalid = await resolver({ name: "" }, {}, options);
  assert.deepEqual(invalid.values, {});
  assert.equal(invalid.errors.name.type, "too_small");
});

test("qs comma serialization cannot throw on non-callable toString input", () => {
  const qs = expressRequire("qs");
  for (const encodeValuesOnly of [false, true]) {
    assert.doesNotThrow(() => qs.stringify(
      JSON.parse('{"a":[{"toString":"x"}]}'),
      { arrayFormat: "comma", encodeValuesOnly },
    ));
  }
  assert.equal(qs.stringify({ a: ["x", "y"] }, { arrayFormat: "comma" }), "a=x%2Cy");
});

test("compressed JSON parsing handles trailing bytes without terminating the server", async () => {
  const bodyParser = expressRequire("body-parser");
  const parser = bodyParser.json();
  const server = createServer((req, res) => {
    parser(req, res, (error?: Error) => {
      res.statusCode = error ? 400 : 200;
      res.end(error ? "Invalid body" : "Parsed");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`;
    const headers = { "Content-Type": "application/json", "Content-Encoding": "gzip" };
    const frame = gzipSync('{"value":"valid"}');
    const valid = await fetch(url, { method: "POST", headers, body: frame });
    assert.equal(valid.status, 200);
    await valid.text();
    const malformed = await fetch(url, {
      method: "POST", headers, body: Buffer.concat([frame, Buffer.from([0xff, 0xff, 0xff])]),
    });
    assert.ok([200, 400].includes(malformed.status));
    await malformed.text();
    // Decoder errors can be emitted after the response has finished.
    await new Promise((resolve) => setTimeout(resolve, 100));
    const alive = await fetch(url);
    assert.equal(alive.status, 200);
    await alive.text();
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
