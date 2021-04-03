const path = require('path');

module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  "lintOnSave": false,
  configureWebpack: {
    devtool: 'source-map',
    node: {
      __dirname:true,
      __filename: true
    }
  },

  assetsDir: '@/assets/',
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        extraResources: './resources'
      },
      mainProcessFile: 'src/background.js',
      rendererProcessFile: 'src/main.js'
    }
  }
}
