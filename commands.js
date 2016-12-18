const ansi = require('./ansi')
const chalk = require('chalk')

module.exports = {
  quit: client => {
    client.end(`\n${ansi.clearLine()}Bye\n${ansi.clearLine()}`)
    return false
  },

  say: (client, ...args) => {
    let str = args.join(' ')
    client.broadcast(str)
  },
}
