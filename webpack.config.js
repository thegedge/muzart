const path = require("path");
const webpack = require("webpack");

const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  mode: isDevelopment ? "development" : "production",

  entry: {
    main: {
      import: "./src/app/index.tsx",
      dependOn: "deps",
    },
    deps: ["lodash", "react", "react-dom", "tone"],
  },

  output: {
    filename: "[name].bundle.js",
    sourceMapFilename: "[name].js.map",
    path: path.resolve(__dirname, "public"),
  },

  resolve: {
    extensions: [".ts", ".js", ".tsx"],
  },

  watchOptions: {
    ignored: "/node_modules/",
  },

  devServer: {
    // contentBase: path.join(__dirname, "public"),
    compress: true,
    port: 3001,
  },

  devtool: isDevelopment ? "eval-source-map" : undefined,

  optimization: {
    runtimeChunk: "single",
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"].filter(Boolean),
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          isDevelopment && {
            loader: "babel-loader",
            options: {
              plugins: ["react-refresh/babel"],
            },
          },
          {
            loader: "ts-loader",
            options: { transpileOnly: true },
          },
        ].filter(Boolean),
      },
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      // Options
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
    ],
  },

  plugins: [
    isDevelopment && new webpack.HotModuleReplacementPlugin(),
    isDevelopment && new ReactRefreshWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "src/app/index.html",
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: isDevelopment ? "development" : "production",
      DEFAULT_FILE: null,
      DEBUG: process.env.DEBUG_APP ?? isDevelopment,
    }),
  ].filter(Boolean),
};
