const ansi = require('./ansi')
const chalk = require('chalk')

module.exports = {
  quit: client => new Promise((resolve, reject) => {
    client.enable()
    client.write(ansi.reset() + 'Bye\n')
    client.end()

    resolve(false)
  }),

  noop: client => new Promise((resolve) => resolve()),

  say: (client, ...args) => new Promise((resolve, reject) => {
    let message = chalk.yellow(args.join(' '))

    client.broadcast(
      `${client.user.styled()} says ${message}\n`
    )

    client.log(
      `You say ${message}\n`
    )

    resolve()
  }),
}
