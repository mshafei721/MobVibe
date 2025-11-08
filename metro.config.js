// Metro Bundle Optimization Configuration
// Enhanced configuration for production bundle size and performance

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,

  transformer: {
    ...config.transformer,

    // Minification configuration for production builds
    minifierConfig: {
      compress: {
        // Remove console.* statements in production
        drop_console: !__DEV__,
        drop_debugger: true,

        // Remove specific console methods
        pure_funcs: __DEV__
          ? []
          : [
              'console.log',
              'console.info',
              'console.debug',
              'console.trace',
              'console.warn',
            ],

        // Dead code elimination
        dead_code: true,
        unused: true,

        // Optimize conditionals
        conditionals: true,
        comparisons: true,
        evaluate: true,
        booleans: true,
        loops: true,

        // Inline functions
        inline: 2,

        // Remove unreachable code
        hoist_funs: true,
        hoist_vars: false,

        // Additional optimizations
        join_vars: true,
        cascade: true,
        collapse_vars: true,
        reduce_vars: true,

        // Keep function names for better error tracking
        keep_fnames: false,
        keep_classnames: false,
      },

      mangle: {
        // Mangle all names except reserved keywords
        toplevel: true,

        // Don't mangle function names in dev for better debugging
        keep_fnames: __DEV__,
        keep_classnames: __DEV__,

        // Reserved names that should never be mangled
        reserved: ['Sentry', 'Supabase', 'Claude'],
      },

      output: {
        // Remove all comments
        comments: false,

        // Use ASCII characters only
        ascii_only: true,

        // Reduce whitespace
        beautify: false,

        // Quote strategy
        quote_style: 1, // Single quotes
      },
    },

    // Enable experimental optimizations
    experimentalImportSupport: true,

    // Inline requires for better tree shaking
    inlineRequires: true,
  },

  resolver: {
    ...config.resolver,

    // Add support for .mjs files
    sourceExts: [...(config.resolver?.sourceExts || []), 'mjs'],

    // Exclude test files and development-only files from bundle
    blockList: [
      // Test files
      /node_modules\/.*\/test\/.*/,
      /node_modules\/.*\/__tests__\/.*/,
      /node_modules\/.*\/__mocks__\/.*/,
      /node_modules\/.*\/spec\/.*/,

      // Documentation
      /node_modules\/.*\/docs?\/.*/,
      /node_modules\/.*\/examples?\/.*/,

      // Development files
      /node_modules\/.*\/\.github\/.*/,
      /node_modules\/.*\/coverage\/.*/,

      // Large unnecessary files
      /node_modules\/.*\/\.md$/,
      /node_modules\/.*\/LICENSE$/,
      /node_modules\/.*\/CHANGELOG\.md$/,
    ],
  },

  serializer: {
    ...config.serializer,

    // Custom module filter to exclude dev dependencies
    processModuleFilter: (module) => {
      // Exclude modules in development that aren't needed in production
      const excludeInProduction = [
        '@testing-library',
        '@types/',
        'prettier',
        'eslint',
        'jest',
        'detox',
      ];

      if (!__DEV__ && module.path) {
        for (const excludePattern of excludeInProduction) {
          if (module.path.includes(excludePattern)) {
            return false;
          }
        }
      }

      return true;
    },
  },

  cacheStores: [
    // Enable disk caching for faster subsequent builds
    {
      name: 'metro-cache',
      useAbsolutePaths: false,
    },
  ],
};
