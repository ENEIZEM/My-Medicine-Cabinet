const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Если transformer не определён — создаём его
config.transformer = config.transformer || {};

// Включаем поддержку require.context
config.transformer.unstable_allowRequireContext = true;

module.exports = config;