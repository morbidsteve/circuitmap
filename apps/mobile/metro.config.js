const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages - include pnpm's .pnpm folder
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules/.pnpm/node_modules'),
];

// 3. Don't disable hierarchical lookup - pnpm needs it to resolve nested deps
config.resolver.disableHierarchicalLookup = false;

// 4. Enable symlink resolution for pnpm
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
