const ansi = require('./ansi')
const chalk = require('chalk')

module.exports = {
  quit: client => new Promise((resolve, reject) => {
    client.enable()
    client.write(ansi.reset() + 'Bye\n')
    client.end()

    resolve(false)
  }),

  say: (client, ...args) => new Promise((resolve, reject) => {
    let str = args.join(' ')
    client.broadcast(str)

    resolve()
  }),
}
