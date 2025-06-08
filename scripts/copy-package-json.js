const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');

const minimalPkg = {
  name: pkg.name,
  version: pkg.version,
  main: 'index.js',
  types: 'index.d.ts',
  exports: {
    '.': './index.js'
  },
  peerDependencies: pkg.peerDependencies,
  dependencies: pkg.dependencies,
  description: pkg.description,
  keywords: pkg.keywords,
  author: pkg.author,
  license: pkg.license,
  repository: pkg.repository,
  bugs: pkg.bugs,
  homepage: pkg.homepage
};

fs.writeFileSync(
  path.join(__dirname, '../dist/package.json'),
  JSON.stringify(minimalPkg, null, 2)
);
