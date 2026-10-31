import "@angular/compiler";
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
  existsSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
// Compile the real source graph into a short-lived test module tree.
export async function loadSource(relativePath) {
  const dir = mkdtempSync(
    join(dirname(fileURLToPath(import.meta.url)), ".behavior-"),
  );
  const cache = new Map();
  const compile = (url) => {
    const key = url.href;
    if (cache.has(key)) return cache.get(key);
    const name = "module-" + cache.size + ".mjs";
    cache.set(key, name);
    const source = readFileSync(url, "utf8");
    let code = transpileModule(source, {
      compilerOptions: {
        target: ScriptTarget.ES2022,
        module: ModuleKind.ES2022,
        experimentalDecorators: true,
      },
    }).outputText;
    code = code.replace(
      /(from\s+|import\s*)(["'])(\.[^"']+)\2/g,
      (match, prefix, quote, path) => {
        let target = new URL(path, url);
        if (!existsSync(target)) target = new URL(path + ".ts", url);
        if (!existsSync(target)) target = new URL(path + "/index.ts", url);
        if (!existsSync(target))
          throw new Error("Missing test import " + target);
        return prefix + quote + "./" + compile(target) + quote;
      },
    );
    writeFileSync(join(dir, name), code);
    return name;
  };
  try {
    return await import(
      pathToFileURL(join(dir, compile(new URL(relativePath, import.meta.url))))
        .href
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
