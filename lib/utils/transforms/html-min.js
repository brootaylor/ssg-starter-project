// const htmlmin = require('html-minifier');

// module.exports = (value, outputPath) => {
//   if (outputPath && outputPath.indexOf('.html') > -1) {
//     return htmlmin.minify(value, {
//       useShortDoctype: true,
//       removeComments: true,
//       collapseWhitespace: false,
//       minifyCSS: true,
//     });
//   }

//   return value;
// };

const htmlmin = require('html-minifier');

module.exports = (content, outputPath) => {
  if (outputPath && outputPath.endsWith('.html')) {
    const minified = htmlmin.minify(content, {
      collapseWhitespace: true,
      preserveLineBreaks: true,
      removeComments: false,
      useShortDoctype: true,
    });
    return minified;
  }

  return content;
};