#!/usr/bin/env node
/**
 * Bundle Size Analysis Script
 *
 * Analyzes React Native bundle size and provides optimization recommendations
 * Uses safe execFile instead of exec to prevent command injection
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const BUNDLE_SIZE_LIMIT_MB = 20;
const BUNDLE_SIZE_WARNING_MB = 15;

console.log('🔍 Analyzing bundle size...\n');

/**
 * Get bundle size for a specific platform
 */
async function getBundleSize(platform) {
  try {
    const bundlePath = path.join(
      __dirname,
      '..',
      'dist',
      `${platform}.bundle`
    );

    if (!fs.existsSync(bundlePath)) {
      console.log(`⚠️  Bundle not found for ${platform}. Skipping build...`);
      return null;
    }

    const stats = fs.statSync(bundlePath);
    const sizeInMB = stats.size / (1024 * 1024);

    return {
      platform,
      sizeInBytes: stats.size,
      sizeInMB: sizeInMB.toFixed(2),
      path: bundlePath,
    };
  } catch (error) {
    console.error(`❌ Error analyzing ${platform} bundle:`, error.message);
    return null;
  }
}

/**
 * Analyze package.json dependencies
 */
function analyzeDependencies() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  const totalDeps = Object.keys(dependencies).length;
  const totalDevDeps = Object.keys(devDependencies).length;

  console.log('📦 Dependencies Analysis:');
  console.log(`  Production dependencies: ${totalDeps}`);
  console.log(`  Dev dependencies: ${totalDevDeps}`);
  console.log();

  // Find large dependencies
  console.log('🔎 Checking for potentially large dependencies...');

  const largeDeps = [
    'moment',
    'lodash',
    'firebase',
    'aws-sdk',
    'react-native-vector-icons',
  ];

  const foundLargeDeps = Object.keys(dependencies).filter(dep =>
    largeDeps.some(large => dep.includes(large))
  );

  if (foundLargeDeps.length > 0) {
    console.log('⚠️  Large dependencies detected:');
    foundLargeDeps.forEach(dep => {
      console.log(`  - ${dep}`);
    });
    console.log('\n💡 Consider:');
    console.log('  - Using date-fns instead of moment');
    console.log('  - Using lodash-es with tree shaking');
    console.log('  - Using selective imports');
    console.log();
  } else {
    console.log('✅ No known large dependencies detected\n');
  }

  return {
    totalDeps,
    totalDevDeps,
    foundLargeDeps,
  };
}

/**
 * Check for duplicate dependencies
 */
async function checkDuplicates() {
  console.log('🔍 Checking for duplicate dependencies...');

  try {
    const { stdout } = await execFileAsync('npm', ['ls', '--all', '--json'], {
      maxBuffer: 50 * 1024 * 1024,
    });

    const tree = JSON.parse(stdout);
    const allDeps = new Map();
    const duplicates = [];

    function traverse(node, path = []) {
      if (!node.dependencies) return;

      Object.entries(node.dependencies).forEach(([name, info]) => {
        const version = info.version;

        if (allDeps.has(name)) {
          const existing = allDeps.get(name);
          if (existing.version !== version) {
            duplicates.push({
              name,
              versions: [existing.version, version],
            });
          }
        } else {
          allDeps.set(name, { version, path: [...path, name] });
        }

        traverse(info, [...path, name]);
      });
    }

    traverse(tree);

    if (duplicates.length > 0) {
      console.log('⚠️  Duplicate dependencies found:');
      duplicates.slice(0, 10).forEach(({ name, versions }) => {
        console.log(`  - ${name}: ${versions.join(', ')}`);
      });
      if (duplicates.length > 10) {
        console.log(`  ... and ${duplicates.length - 10} more`);
      }
      console.log('\n💡 Run: npm dedupe\n');
    } else {
      console.log('✅ No duplicate dependencies\n');
    }

    return duplicates;
  } catch (error) {
    console.log('⚠️  Could not check for duplicates\n');
    return [];
  }
}

/**
 * Provide optimization recommendations
 */
function provideRecommendations(bundleData, depsData) {
  console.log('💡 Optimization Recommendations:\n');

  const recommendations = [];

  // Bundle size recommendations
  if (bundleData) {
    if (parseFloat(bundleData.sizeInMB) > BUNDLE_SIZE_LIMIT_MB) {
      recommendations.push({
        severity: 'critical',
        message: `Bundle size (${bundleData.sizeInMB}MB) exceeds limit (${BUNDLE_SIZE_LIMIT_MB}MB)`,
        action: 'Reduce bundle size by removing unused dependencies or implementing code splitting',
      });
    } else if (parseFloat(bundleData.sizeInMB) > BUNDLE_SIZE_WARNING_MB) {
      recommendations.push({
        severity: 'warning',
        message: `Bundle size (${bundleData.sizeInMB}MB) approaching limit`,
        action: 'Consider optimizing before adding more dependencies',
      });
    }
  }

  // Dependency recommendations
  if (depsData.foundLargeDeps.length > 0) {
    recommendations.push({
      severity: 'warning',
      message: 'Large dependencies detected',
      action: 'Consider lighter alternatives or selective imports',
    });
  }

  // General recommendations
  recommendations.push(
    {
      severity: 'info',
      message: 'Enable Hermes engine',
      action: 'Hermes reduces bundle size and improves performance',
    },
    {
      severity: 'info',
      message: 'Use ProGuard/R8 (Android)',
      action: 'Enable code shrinking in android/app/build.gradle',
    },
    {
      severity: 'info',
      message: 'Optimize images',
      action: 'Use WebP format and appropriate resolutions',
    },
    {
      severity: 'info',
      message: 'Implement code splitting',
      action: 'Lazy load screens and heavy components',
    }
  );

  // Print recommendations
  recommendations.forEach(({ severity, message, action }) => {
    const icon = {
      critical: '🔴',
      warning: '⚠️',
      info: '💡',
    }[severity];

    console.log(`${icon} ${message}`);
    console.log(`   → ${action}\n`);
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   Bundle Size Analysis - MobVibe');
  console.log('═══════════════════════════════════════\n');

  // Analyze dependencies
  const depsData = analyzeDependencies();

  // Check for duplicates
  await checkDuplicates();

  // Analyze Android bundle (primary platform)
  const bundleData = await getBundleSize('android');

  if (bundleData) {
    console.log('📊 Bundle Size Report:');
    console.log(`  Platform: ${bundleData.platform}`);
    console.log(`  Size: ${bundleData.sizeInMB} MB`);
    console.log(`  Path: ${bundleData.path}`);
    console.log();

    const sizeMB = parseFloat(bundleData.sizeInMB);
    if (sizeMB > BUNDLE_SIZE_LIMIT_MB) {
      console.log(`❌ Bundle exceeds ${BUNDLE_SIZE_LIMIT_MB}MB limit!`);
    } else if (sizeMB > BUNDLE_SIZE_WARNING_MB) {
      console.log(`⚠️  Bundle approaching ${BUNDLE_SIZE_LIMIT_MB}MB limit`);
    } else {
      console.log(`✅ Bundle size within acceptable range`);
    }
    console.log();
  }

  // Provide recommendations
  provideRecommendations(bundleData, depsData);

  console.log('═══════════════════════════════════════\n');

  // Exit with error if bundle is too large
  if (bundleData && parseFloat(bundleData.sizeInMB) > BUNDLE_SIZE_LIMIT_MB) {
    process.exit(1);
  }
}

// Run analysis
main().catch(error => {
  console.error('Error running analysis:', error);
  process.exit(1);
});
