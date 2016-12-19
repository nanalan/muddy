// some of this stolen from @liam4
// thx m8

const ESC = '\x1b'

module.exports = {
  ESC,

  clearScreen() {
    // Clears the screen, removing any characters displayed, and resets the
    // cursor position.

    return `${ESC}[2J`
  },

  clearLine() {
    // Clears the current line and resets the cursor position.

    return `${ESC}[2K\r`
  },

  up(n=1) {
    return `${ESC}[${n}A`
  },

  down(n=1) {
    return `${ESC}[${n}B`
  },

  left(n=1) {
    return `${ESC}[${n}D`
  },

  right(n=1) {
    return `${ESC}[${n}C`
  },

  moveCursorRaw(line, col) {
    // Moves the cursor to the given line and column on the screen.
    // Returns the pure ANSI code, with no modification to line or col.

    return `${ESC}[${line};${col}H`
  },

  moveCursor(line, col) {
    // Moves the cursor to the given line and column on the screen.
    // Note that since in JavaScript indexes start at 0, but in ANSI codes
    // the top left of the screen is (1, 1), this function adjusts the
    // arguments to act as if the top left of the screen is (0, 0).

    return `${ESC}[${line + 1};${col + 1}H`
  },

  reset() {
    // Resets all attributes, including text decorations, foreground and
    // background color.

    return `${ESC}[0m`
  },

  invert() {
    // Inverts the foreground and background colors.

    return `${ESC}[7m`
  }
}
