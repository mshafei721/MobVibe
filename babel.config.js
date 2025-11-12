module.exports = function (api) {
  const isTest = api.env('test');
  api.cache.using(() => isTest);

  return {
    presets: [
      ['babel-preset-expo', isTest ? {} : { jsxImportSource: 'nativewind' }]
    ],
    plugins: isTest
      ? []
      : [
          'nativewind/babel',
          'react-native-reanimated/plugin', // Must be last
        ]
  };
};
