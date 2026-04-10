const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

process.env.EXPO_ROUTER_APP_ROOT = path.join(__dirname, 'app');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
