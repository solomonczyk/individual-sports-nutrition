module.exports = function(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // expo-router/babel больше не нужен в SDK 50 - уже включен в babel-preset-expo
      // Временно отключен nativewind/babel для веб-версии
      // TODO: Восстановить после настройки NativeWind для веб
      // 'nativewind/babel',
    ],
  }
}

