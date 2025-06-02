module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // если вы используете «@/…» алиасы, то
      ['module-resolver', {
        root: ['./'],
        alias: { '@': './' },
      }],
      // плагин Reanimated обязательно **последним**
      'react-native-reanimated/plugin',
    ],
  };
};