module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // React Navigation v7 recommends the react-native-worklets/plugin FIRST.
      // Reanimated 4.x depends on these worklets.
      'react-native-worklets/plugin',
      ['module-resolver', {
        alias: {
          '@': './src'
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
      }]
    ]
  };
};
