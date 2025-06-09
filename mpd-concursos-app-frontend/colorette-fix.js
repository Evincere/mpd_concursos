// Colorette replacement - eliminates the problematic colorette functionality
// This is a minimal implementation that prevents the stack overflow

const colorette = {
  // Basic color functions that return the input unchanged
  reset: (str) => str,
  bold: (str) => str,
  dim: (str) => str,
  italic: (str) => str,
  underline: (str) => str,
  inverse: (str) => str,
  hidden: (str) => str,
  strikethrough: (str) => str,
  
  // Color functions
  black: (str) => str,
  red: (str) => str,
  green: (str) => str,
  yellow: (str) => str,
  blue: (str) => str,
  magenta: (str) => str,
  cyan: (str) => str,
  white: (str) => str,
  gray: (str) => str,
  grey: (str) => str,
  
  // Background colors
  bgBlack: (str) => str,
  bgRed: (str) => str,
  bgGreen: (str) => str,
  bgYellow: (str) => str,
  bgBlue: (str) => str,
  bgMagenta: (str) => str,
  bgCyan: (str) => str,
  bgWhite: (str) => str,
  
  // Bright colors
  blackBright: (str) => str,
  redBright: (str) => str,
  greenBright: (str) => str,
  yellowBright: (str) => str,
  blueBright: (str) => str,
  magentaBright: (str) => str,
  cyanBright: (str) => str,
  whiteBright: (str) => str,
  
  // Bright background colors
  bgBlackBright: (str) => str,
  bgRedBright: (str) => str,
  bgGreenBright: (str) => str,
  bgYellowBright: (str) => str,
  bgBlueBright: (str) => str,
  bgMagentaBright: (str) => str,
  bgCyanBright: (str) => str,
  bgWhiteBright: (str) => str,
  
  // Options
  options: {
    enabled: false
  },
  
  // Create color function
  createColors: () => colorette,
  
  // Enable/disable
  isColorSupported: false
};

module.exports = colorette;
