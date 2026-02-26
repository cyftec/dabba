import type { KarmaConfig, ProjectFileNames } from "./karma-types.ts";

// DO NOT CHANGE exported variable name
export const projectFileNames = {
  buildable: {
    mayaSrcDir: "dev",
    pageFile: "page.ts",
    manifestFile: "manifest.ts",
  },
  static: {
    sourceDir: "dev",
    karmaTypesFile: "karma-types.ts",
  },
  systemGenerated: {
    dsStoreDir: ".DS_Store",
  },
  generated: {
    stagingDir: "stage",
    publishDir: "prod",
    bunLockFile: "bun.lock",
    bunLockBFile: "bun.lockb",
    gitIgnoreFile: ".gitignore",
    dotVscodeDir: ".vscode",
    nodeModulesDir: "node_modules",
    packageJsonFile: "package.json",
  },
} as const satisfies ProjectFileNames;

// DO NOT CHANGE exported variable name
export const config: KarmaConfig = {
  brahma: {
    version: "0.1.31",
    build: {
      mode: "web",
      skipErrorAndBuildNext: false,
      ignoreDelimiter: "@",
      sourceDirName: projectFileNames.static.sourceDir,
      mayaSrcDir: projectFileNames.buildable.mayaSrcDir,
      buildablePageFileName: projectFileNames.buildable.pageFile,
      buildableManifestFileName: projectFileNames.buildable.manifestFile,
      stagingDirName: projectFileNames.generated.stagingDir,
      publishDirName: projectFileNames.generated.publishDir,
    },
    serve: {
      port: 3000,
      redirectOnStart: false,
      reloadPageOnFocus: false,
      watchDir: projectFileNames.static.sourceDir,
      serveDir: projectFileNames.generated.stagingDir,
    },
  },
  packageJson: {
    dependencies: {
      "@mufw/maya": "0.1.32",
      "@cyftech/immutjs": "0.1.0",
      "@cyftech/signal": "0.1.15",
    },
  },
  vscode: {
    settings: {
      "deno.enable": false,
      "files.exclude": {
        [projectFileNames.static.karmaTypesFile]: true,
        [projectFileNames.generated.stagingDir]: false,
        [projectFileNames.generated.publishDir]: false,
        [projectFileNames.generated.bunLockFile]: true,
        [projectFileNames.generated.bunLockBFile]: true,
        [projectFileNames.generated.gitIgnoreFile]: true,
        [projectFileNames.generated.dotVscodeDir]: true,
        [projectFileNames.generated.nodeModulesDir]: true,
        [projectFileNames.generated.packageJsonFile]: true,
      },
    },
  },
  git: {
    ignore: [
      projectFileNames.systemGenerated.dsStoreDir,
      projectFileNames.static.karmaTypesFile,
      projectFileNames.generated.bunLockFile,
      projectFileNames.generated.bunLockBFile,
      projectFileNames.generated.dotVscodeDir,
      projectFileNames.generated.nodeModulesDir,
      projectFileNames.generated.packageJsonFile,
      `/${projectFileNames.generated.stagingDir}`,
    ],
  },
};
