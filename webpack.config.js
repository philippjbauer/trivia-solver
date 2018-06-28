const Path = require("path");

let config = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: Path.resolve(__dirname, "dist/"),
    filename: "app.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|dist)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ["@babel/env", {
                "targets": {
                  "node": "10.1.0"
                }
              }]
            ],
            plugins: ["@babel/plugin-transform-runtime"]
          }
        }
      }
    ]
  },
  plugins: []
};

module.exports = (env, argv) => {
  return config;
};