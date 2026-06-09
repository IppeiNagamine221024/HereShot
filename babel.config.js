module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo（SDK 54+）が expo-router / reanimated(worklets) の
    // 変換を内包しているため、追加プラグインは原則不要。
    presets: ['babel-preset-expo'],
  };
};
