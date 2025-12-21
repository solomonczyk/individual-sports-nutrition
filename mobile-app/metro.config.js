const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Упрощенная конфигурация для веб-версии
// NativeWind обрабатывается через Babel плагин
module.exports = config

