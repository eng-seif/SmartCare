import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { mockupPreviewPlugin } from "../../artifacts/mockup-sandbox/mockupPreviewPlugin";

const healthRequire = createRequire(
  new URL("../../artifacts/fathalla-health/package.json", import.meta.url),
);
const configRequire = createRequire(healthRequire.resolve("eslint-config-next"));
const nextPluginEntry = configRequire.resolve("@next/eslint-plugin-next");
const { getRootDirs } = configRequire(
  path.join(path.dirname(nextPluginEntry), "utils/get-root-dirs.js"),
);

function fixture(run: (root: string) => Promise<void> | void) {
  const root = mkdtempSync(path.join(os.tmpdir(), "dependency-globbing-"));
  return Promise.resolve().then(() => run(root)).finally(() => {
    rmSync(root, { recursive: true, force: true });
  });
}

function put(root: string, file: string) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, "export default function Example() { return null; }\n");
}

test("Next ESLint root discovery uses the safe replacement and preserves directory glob behavior", () =>
  fixture((root) => {
    const nextRequire = createRequire(nextPluginEntry);
    assert.equal(nextRequire("fast-glob/package.json").name, "tinyglobby");
    for (const name of ["apps/shop", "apps/admin", "packages/ui"]) {
      mkdirSync(path.join(root, name), { recursive: true });
    }
    put(root, "apps/not-a-directory.ts");
    const context = (rootDir?: string | string[]) => ({
      cwd: root,
      settings: rootDir === undefined ? {} : { next: { rootDir } },
    });
    assert.deepEqual(getRootDirs(context()), [root]);
    assert.deepEqual(getRootDirs(context(`${root}/apps/*`)).sort(), [
      `${root}/apps/admin`, `${root}/apps/shop`,
    ]);
    assert.deepEqual(getRootDirs(context([
      `${root}/apps/{shop,admin}`, `${root}/packages/*`,
    ])).sort(), [
      `${root}/apps/admin`, `${root}/apps/shop`, `${root}/packages/ui`,
    ]);
    assert.deepEqual(getRootDirs(context(`${root}/missing/*`)), []);
    assert.deepEqual(getRootDirs(context(`${root}/apps`)), [`${root}/apps`]);
    const relativeRoot = path.relative(process.cwd(), root);
    assert.deepEqual(getRootDirs(context(`${relativeRoot}/apps/*`)).sort(), [
      `${relativeRoot}/apps/admin`, `${relativeRoot}/apps/shop`,
    ]);
    assert.deepEqual(getRootDirs(context(`${root}/apps/shop`.replaceAll("/", "\\"))), [
      `${root}/apps/shop`,
    ]);
  }));

test("mockup discovery preserves nested TSX matching, helper exclusions, additions and removals", () =>
  fixture(async (root) => {
    for (const file of [
      "src/components/mockups/Example.tsx",
      "src/components/mockups/nested/Detail.tsx",
      "src/components/mockups/_Helper.tsx",
      "src/components/mockups/_private/Hidden.tsx",
      "src/components/mockups/.hidden/Dot.tsx",
      "src/components/mockups/nested/util.ts",
    ]) {
      put(root, file);
    }
    const plugin = mockupPreviewPlugin();
    // These hooks only need the configured root, not a running Vite server.
    assert.equal(typeof plugin.configResolved, "function");
    Reflect.apply(plugin.configResolved as Function, {}, [{ root }]);
    assert.equal(typeof plugin.buildStart, "function");
    const refresh = () => Reflect.apply(plugin.buildStart as Function, {}, []);
    const source = () => readFileSync(
      path.join(root, "src/.generated/mockup-components.ts"), "utf8",
    );
    await refresh();
    assert.match(source(), /"\.\/components\/mockups\/Example\.tsx"/);
    assert.match(source(), /import\("\.\.\/components\/mockups\/nested\/Detail\.tsx"\)/);
    assert.doesNotMatch(source(), /Helper|Hidden|Dot|util/);
    put(root, "src/components/mockups/New.tsx");
    unlinkSync(path.join(root, "src/components/mockups/Example.tsx"));
    await refresh();
    assert.match(source(), /New\.tsx/);
    assert.doesNotMatch(source(), /Example\.tsx/);
    rmSync(path.join(root, "src/components/mockups"), { recursive: true });
    await refresh();
    assert.match(source(), /export const modules: ModuleMap = \{\n\n\};/);
  }));
