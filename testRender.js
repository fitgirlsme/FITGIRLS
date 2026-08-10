require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react']
});
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const App = require('./src/App.jsx').default;
const Lookbook = require('./src/components/sections/Lookbook.jsx').default;

try {
  // Mock everything
  console.log("Mocking things...");
  global.window = { scrollTo: () => {} };
  global.localStorage = { getItem: () => null };
  const str = ReactDOMServer.renderToString(React.createElement(Lookbook));
  console.log("Success! Length:", str.length);
} catch (e) {
  console.error("Render crashed:", e);
}
