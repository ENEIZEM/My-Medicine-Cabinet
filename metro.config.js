const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Если transformer не определён — создаём его
config.transformer = config.transformer || {};

// Включаем поддержку require.context
config.transformer.unstable_allowRequireContext = true;

config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

module.exports = config;