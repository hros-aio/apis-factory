const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse CLI arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const packageArg = args.find(arg => arg.startsWith('--package='))?.split('=')[1] || 'all';

console.log(`Starting publication process...`);
console.log(`Dry-run: ${dryRun ? 'YES' : 'NO'}`);
console.log(`Package filter: ${packageArg}`);

// Define paths
const libsDir = path.join(__dirname, '../libs');

// Resolve packages to publish
const packages = fs.readdirSync(libsDir)
  .map(dir => {
    const pkgJsonPath = path.join(libsDir, dir, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) return null;
    
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      return {
        dirName: dir,
        path: path.join(libsDir, dir),
        name: pkgJson.name,
        version: pkgJson.version,
        private: !!pkgJson.private
      };
    } catch (e) {
      console.error(`Failed to parse package.json for ${dir}:`, e.message);
      return null;
    }
  })
  .filter(pkg => pkg !== null && !pkg.private);

if (packages.length === 0) {
  console.log('No publishable packages found.');
  process.exit(0);
}

// Function to check if a package version is already published
function isPublished(name, version) {
  try {
    const output = execSync(`npm view ${name}@${version} version --registry=https://registry.npmjs.org/`, { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return output === version;
  } catch (e) {
    // If the package doesn't exist on npm yet, npm view fails, meaning it's not published.
    return false;
  }
}

// Perform publish
let hasError = false;

// Sort packages so dependencies are published in correct order
// In our monorepo: libs-core -> libs-sql, libs-mongo, libs-apis
const order = ['@new-hros/libs-core', '@new-hros/libs-sql', '@new-hros/libs-mongo', '@new-hros/libs-apis'];
packages.sort((a, b) => {
  const indexA = order.indexOf(a.name);
  const indexB = order.indexOf(b.name);
  if (indexA === -1 && indexB === -1) return 0;
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
});

for (const pkg of packages) {
  // If a specific package filter is applied, skip other packages
  if (packageArg !== 'all' && packageArg !== pkg.name && packageArg !== pkg.dirName) {
    console.log(`Skipping package ${pkg.name} (does not match filter: ${packageArg})`);
    continue;
  }

  console.log(`\nChecking package: ${pkg.name}@${pkg.version}...`);

  if (isPublished(pkg.name, pkg.version)) {
    console.log(`Package ${pkg.name}@${pkg.version} is already published on npm. Skipping.`);
    continue;
  }

  console.log(`Package ${pkg.name}@${pkg.version} is not published. Preparing to publish...`);

  if (dryRun) {
    console.log(`[DRY RUN] Would publish ${pkg.name}@${pkg.version} inside ${pkg.path}`);
  } else {
    try {
      console.log(`Publishing ${pkg.name}@${pkg.version}...`);
      execSync('npm publish --access public', {
        cwd: pkg.path,
        stdio: 'inherit'
      });
      console.log(`Successfully published ${pkg.name}@${pkg.version}!`);
    } catch (e) {
      console.error(`Failed to publish package ${pkg.name}:`, e.message);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\nPublish finished with errors.');
  process.exit(1);
} else {
  console.log('\nPublish process completed successfully.');
}
