import "@angular/compiler";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";

// Transpile real Angular source for behavior tests. Templates are checked by ng build.
export async function loadSource(relativePath) {
  const directory = mkdtempSync(
    join(dirname(fileURLToPath(import.meta.url)), ".behavior-"),
  );
  const options = {
    compilerOptions: {
      target: ScriptTarget.ES2022,
      module: ModuleKind.ES2022,
      experimentalDecorators: true,
    },
  };
  const compile = (text) => transpileModule(text, options).outputText;
  const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
  try {
    writeFileSync(
      join(directory, "environment.mjs"),
      compile(read("../src/environments/environment.ts")),
    );
    writeFileSync(
      join(directory, "icon.mjs"),
      compile(read("../src/app/shared/icon/icon.component.ts")),
    );
    const source = read(relativePath)
      .replace(
        /(["'])(?:\.\.\/)+environments\/environment\1/g,
        "'./environment.mjs'",
      )
      .replace(
        /(["'])(?:\.\.\/)+shared\/icon\/icon.component\1/g,
        "'./icon.mjs'",
      );
    const path = join(directory, "component.mjs");
    writeFileSync(path, compile(source));
    return await import(pathToFileURL(path).href);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
