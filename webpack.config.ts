import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "node:path";
import { Configuration, EnvironmentPlugin, HotModuleReplacementPlugin } from "webpack";
import "webpack-dev-server";

const isDevelopment = process.env.NODE_ENV !== "production";

const plugins: Configuration["plugins"] = [];
if (isDevelopment) {
  plugins.push(new HotModuleReplacementPlugin());
  plugins.push(new ReactRefreshWebpackPlugin());
}

plugins.push(
  new HtmlWebpackPlugin({
    template: "./src/app/index.html",
  })
);

plugins.push(
  new EnvironmentPlugin({
    NODE_ENV: isDevelopment ? "development" : "production",
    DEFAULT_FILE: null,
    DEBUG: process.env.DEBUG_APP ?? isDevelopment,
  })
);

const configuration: Configuration = {
  mode: isDevelopment ? "development" : "production",

  entry: {
    main: {
      import: ["./src/app/index.tsx"],
      dependOn: ["deps"],
    },
    deps: {
      import: ["lodash", "react", "react-dom", "tone"],
    },
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
          ...(isDevelopment
            ? [
                {
                  loader: "babel-loader",
                  options: {
                    plugins: ["react-refresh/babel", "@babel/plugin-transform-react-display-name"],
                  },
                },
              ]
            : []),
          {
            loader: "ts-loader",
            options: { transpileOnly: true },
          },
        ],
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

  plugins,
};

export default configuration;
