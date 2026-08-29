import type { Karma, ProjectFileNames } from "./types.js";

const files = {
  buildable: {
    appSrcDir: "dev",
    appViewDir: "dev/view/pages",
    manifestFile: "manifest.ts",
    pageFile: "page.ts",
    assetsDirName: "assets",
    stylesheetFile: "styles.ts",
  },
  static: {
    publishDir: "docs",
    dsStoreDir: ".DS_Store",
    gitIgnoreFile: ".gitignore",
  },
  disposable: {
    stagingDir: "stage",
    dotVscodeDir: ".vscode",
    dotZedDir: ".zed",
    nodeModulesDir: "node_modules",
    bunLockFile: "bun.lock",
    bunLockBFile: "bun.lockb",
    packageJsonFile: "package.json",
    tsConfigFile: "tsconfig.json",
  },
} as const satisfies ProjectFileNames;

// DO NOT CHANGE exported variable name
export const karma: Karma = {
  brahma: {
    build: {
      appSrcDir: files.buildable.appSrcDir,
      appViewDir: files.buildable.appViewDir,
      skipErrorAndBuildNext: false,
      ignoreDelimiter: "@",
      buildablePageFileName: files.buildable.pageFile,
      buildableStylesheetFileName: files.buildable.stylesheetFile,
      assetsDirName: files.buildable.assetsDirName,
      buildableManifestFileName: files.buildable.manifestFile,
      stagingDir: files.disposable.stagingDir,
      publishDir: files.static.publishDir,
      disposable: Object.values(files.disposable),
    },
    serve: {
      port: 3000,
      redirectOnStart: false,
      reloadPageOnFocus: false,
      watchDir: files.buildable.appSrcDir,
      serveDir: files.disposable.stagingDir,
    },
  },
  maya: {
    name: "dabba",
    appType: "pwa",
    dependencies: {
      "@cyftec/drive-socket": "0.3.0",
      "@cyftec/maya": "0.2.5",
    },
    devDependencies: {
      "@types/web-app-manifest": "1.0.8",
      "@types/bun": "^1.3.14",
      typescript: "7.0.2",
    },
  },
  vscode: {
    settings: {
      "deno.enable": false,
      "files.exclude": {
        [files.static.gitIgnoreFile]: true,
        [files.static.publishDir]: false,
        [files.disposable.stagingDir]: false,
        [files.disposable.bunLockFile]: true,
        [files.disposable.bunLockBFile]: true,
        [files.disposable.dotVscodeDir]: true,
        [files.disposable.dotZedDir]: true,
        [files.disposable.nodeModulesDir]: true,
        [files.disposable.packageJsonFile]: true,
        [files.disposable.tsConfigFile]: true,
      },
    },
  },
  zed: {
    settings: {
      // Configuring this setting replaces Zed's defaults, so retain them here.
      file_scan_exclusions: [
        "**/.git",
        "**/.svn",
        "**/.hg",
        "**/.jj",
        "**/CVS",
        "**/.DS_Store",
        "**/Thumbs.db",
        "**/.classpath",
        "**/.settings",
        files.static.gitIgnoreFile,
        files.disposable.bunLockFile,
        files.disposable.bunLockBFile,
        files.disposable.dotVscodeDir,
        files.disposable.dotZedDir,
        files.disposable.nodeModulesDir,
        files.disposable.packageJsonFile,
        files.disposable.tsConfigFile,
      ],
      file_scan_inclusions: [
        ".env*",
        files.static.publishDir,
        files.disposable.stagingDir,
      ],
    },
  },
  git: {
    ignore: [
      files.static.dsStoreDir,
      files.disposable.bunLockFile,
      files.disposable.bunLockBFile,
      files.disposable.dotVscodeDir,
      files.disposable.dotZedDir,
      files.disposable.nodeModulesDir,
      files.disposable.packageJsonFile,
      files.disposable.stagingDir,
      files.disposable.tsConfigFile,
    ],
  },
  tsconfig: {
    compilerOptions: {
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "Bundler",
      allowImportingTsExtensions: true,
      noEmit: true,
      moduleDetection: "force",
      isolatedModules: true,
      strict: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      noErrorTruncation: true,
      noFallthroughCasesInSwitch: true,
      noPropertyAccessFromIndexSignature: true,
      noUncheckedIndexedAccess: true,
      noUncheckedSideEffectImports: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      types: ["bun-types"],
    },
    include: ["_karma/**/*.ts", "dev/**/*.ts"],
  },
};
