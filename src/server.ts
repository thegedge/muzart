import express from "express";

const app = express();
const webpack = require("webpack");
const webpackConfig = require("../webpack.config");
const webpackCompiler = webpack(webpackConfig);

app.use(express.static("public"));

app.use(
  require("webpack-dev-middleware")(webpackCompiler, {
    // noInfo: true,
    publicPath: webpackConfig.output.publicPath,
  })
);

app.use(
  require("webpack-hot-middleware")(webpackCompiler, {
    path: "/__webpack_hmr",
  })
);

app.listen(3001, () => {
  console.log(`Example app listening at http://localhost:3001`);
});
