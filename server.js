const net = require('net')
const ansi = require('./ansi')
const chalk = require('chalk')
const commands = require('./commands')
const { db, User, style } = require('./db')
const races = require('./races')

const capitalize = ([first, ...rest]) =>
  first.toUpperCase() + rest.join('').toLowerCase()

let clients = []

let server = net.createServer(client => {
  client.setKeepAlive(true, 500)
  client.setTimeout(3000)
  client.setEncoding('utf8')

  client.name = (client.remoteAddress || client.localAddress) + ':' + (client.remotePort || client.localPort)

  clients.push(client)

  client.broadcast = message => {
    for (let sock of clients) {
      if (sock !== client && sock.state === 'ingame') {
        sock.log(message)
      }
    }
  }

  client.logs = Array(30).fill(ansi.clearLine()) // TODO
  client.log = msg => {
    client.logs[client.logs.length-1] = ansi.clearLine() + msg

    // Redraw the entire log except for the bottom line

    let res = '\u001b7' + ansi.up(1)

    for (let log of client.logs) {
      res += log
    }

    res += ansi.down(1) + '\u001b8'

    client.write(res)
  }

  client.writeLn = msg => {
    client.write(ansi.up() + '\n' + ansi.clearLine() + msg.replace(/\n/g, '\n' + ansi.clearLine()) + '\n' + ansi.down() + ansi.left(9000))
  }

  client.disable = () => {
    client.disabled = true

    // IAC WILL ECHO (disable localecho on client)
    client.write(new Buffer([0xFF, 0xFB, 0x01]))

    // ANSI hide cursor
    client.write('\x1b[?25l')
  }

  client.enable = () => {
    client.disabled = false

    // IAC WONT ECHO (enable localecho on client)
    client.write(new Buffer([0xFF, 0xFC, 0x01]))

    // ANSI show cursor
    client.write('\x1b[?25h')
  }

  client.on('data', data => {
    if (client.disabled) return
    let str = data.toString().trim().replace(/[^\x20-\x7F]/g, '')
    if (!str) return

    client.disable()
    client.write(ansi.reset())

    if (client.state === 'login-name') {
      if (/^[A-Za-z]+$/.test(str)) {
        // Valid
        let name = client.name = capitalize(str)

        client.write(ansi.up() + ansi.clearLine() + 'Name? ' + chalk.blue(name) + '\n' + ansi.clearLine())

        User.findOne({ name }).exec()
          .then(user => {
            if (user) {
              client.state = 'login-pass'
              client.user = user

              client.write(`Pass? `)
              client.enable()

              // IAC WILL ECHO (disable localecho on client)
              client.write(new Buffer([0xFF, 0xFB, 0x01]))
            } else {
              client.state = 'login-make'

              client.write(`Would you like to create a new character, ${chalk.bold(name)}? ` + chalk.styles.blue.open)
              client.enable()
            }
          })
          .catch(err => {
            console.error(err)

            client.write(chalk.red('An unknown error occurred.\n'))
            client.write(`Name? ` + chalk.styles.blue.open)
            client.enable()
          })
      } else {
        // Invalid
        client.write(ansi.clearLine() + `${chalk.red('Invalid, you may only use A-Z!')}\n${ansi.clearLine()}Name? ` + chalk.styles.blue.open)
        client.enable()
      }
    } else if (client.state === 'login-make') {
      if (str.toLowerCase()[0] === 'y') {
        client.writeLn(ansi.clearScreen())
        client.write(`Are you ${chalk.cyan('male')}, ${chalk.magenta('female')}, or ${chalk.yellow('other')}? ` + chalk.styles.blue.open)
        client.state = 'login-make-gender'
        client.enable()
      } else {
        client.state = 'login-name'
        client.write(`\nName? ` + chalk.styles.blue.open)
        client.enable()
      }
    } else if (client.state === 'login-make-gender') {
      let gender = client.gender = str.toLowerCase()[0]

      if (gender === 'm') gender = 'male'
      else if (gender === 'f') gender = 'female'
      else gender = 'other'

      client.gender = gender
      client.write(ansi.clearScreen())
      client.writeLn(races.join('\n\n'))

      client.state = 'login-make-race'
      client.writeLn(chalk.bold('\nScroll up to see races.'))
      client.write(`Which race shall you be? ` + chalk.styles.blue.open)
      client.enable()
    } else if (client.state === 'login-make-race') {
      let race = client.race = capitalize(str.trim())

      if (['Human', 'Elf', 'Dwarf', 'Giant'].includes(race)) {
        client.state = 'login-make-job'
        client.write(ansi.clearScreen())
        client.writeLn(races[['Human', 'Elf', 'Dwarf', 'Giant'].indexOf(race)])
        client.write(`\nWhat will be your class? ` + chalk.styles.blue.open)
        client.enable()
      } else {
        client.writeLn(chalk.red(`\n"${race}" is not a race.`))
        client.write(`Which race shall you be? ` + chalk.styles.blue.open)
        client.enable()
      }
    } else if (client.state === 'login-make-job') {
      let job = client.class = capitalize(str.trim())

      if (['Warrior', 'Monk', 'Mage', 'Thief', 'Illusionist', 'Archer'].includes(job)) {
        client.state = 'login-make-check'
        client.writeLn(ansi.clearScreen() + `
${style(client.gender, `${client.name} (${client.race})`)}, ${chalk.bold(client.class)}
`)
        client.write(`Is this OK? ` + chalk.styles.blue.open)
        client.enable()
      } else {
        client.writeLn(chalk.red(`\n"${job}" is not a valid class.`))
        client.write(`What will be your class? ` + chalk.styles.blue.open)
        client.enable()
      }
    } else if (client.state === 'login-make-check') {
      if (str.toLowerCase()[0] === 'y') {
        client.writeLn(ansi.clearScreen() + `And, lastly, you must set a password, ${style(client.gender, client.name)}.`)
        client.write(`Pass? ` + chalk.styles.blue.open)
        client.state = 'login-make-pass'
        client.enable()
      } else {
        client.state = 'login-make'
        client.write(ansi.clearScreen() + 'Starting over.')
        client.enable()
      }

      // IAC WILL ECHO (disable localecho on client)
      client.write(new Buffer([0xFF, 0xFB, 0x01]))
    } else if (client.state === 'login-make-pass') {
      let pass = str

      client.writeLn(ansi.clearScreen() + `Creating ${style(client.gender, client.name)}...`)

      let user = new User({
        name: client.name,
        pass, // hashing done in db.js
        gender: client.gender,
        race: client.race,
        class: client.class,
      })

      user.save()
        .then(() => {
          client.writeLn(`Done! Welcome to ${chalk.red.bold('Jasma')}, ${style(client.gender, client.name)}!\n\n`)

          client.state = 'ingame'
          client.user = user
          client.write('> ' + chalk.styles.cyan.open)

          client.enable()
        })
        .catch(e => {
          console.error(e)
          client.writeLn(chalk.red('An unknown error occured.'))
          client.state = 'login-make'
        })
    } else if (client.state === 'login-pass') {
      let pass = str

      client.write('\n'+ansi.clearLine()+chalk.dim('...'))

      User.findOne({ name: client.name }).exec()
        .then(user => user.checkPass(pass))
        .then(valid => {
          if (valid) {
            client.writeLn(ansi.clearScreen() + chalk.green.bold(`Welcome back!\n`))
            client.state = 'ingame'
            client.write('> ' + chalk.styles.cyan.open)

            client.enable()
          } else {
            client.write(chalk.red('Invalid password.\n'))
            client.state = 'login-name'
            client.write(`Name? ` + chalk.styles.blue.open)
            client.enable()
          }
        })
        .catch(err => {
          console.error(err)

          client.write(chalk.red('An unknown error occurred.\n'))
          client.state = 'login-name'
          client.write(`Name? ` + chalk.styles.blue.open)
          client.enable()
        })
    } else if (client.state === 'ingame') {
      let args = parse(str)

      client.write(chalk.styles.bold.close)
      client.log(`> ${chalk.cyan(str)}\n`)

      command(...args)
        .then(stop => {
          if (stop) return

          client.write('> ' + chalk.styles.cyan.open)
          client.enable()
        })
        .catch(console.error)
    }
  })

  client.on('end', () => {
    // Remove the client when it leaves
    client.broadcast(client.name + ' left')
    clients.splice(clients.indexOf(client), 1)
  })

  // Process a command + args set
  function command(cmd, ...args) {
    if (cmd in commands) {
      return commands[cmd](client, ...args)
    } else {
      return new Promise((resolve, reject) => {
        client.log(chalk.red(`Unknown command ${chalk.bold(cmd)}\n`))
        resolve()
      })
    }
  }

  // Parse a command+args string into array
  function parse(str) {
    return str.split(' ')
  }

  client.writeLn(ansi.clearScreen() + chalk.bold.red(`
  _________ _______  _______  _______  _______
  \\__    _/(  ___  )(  ____ \\(       )(  ___  )
     )  (  | (   ) || (    \\/| () () || (   ) |
     |  |  | (___) || (_____ | || || || (___) |
     |  |  |  ___  |(_____  )| |(_)| ||  ___  |
     |  |  | (   ) |      ) || |   | || (   ) |
  |\\_)  )  | )   ( |/\\____) || )   ( || )   ( |
  (____/   |/     \\|\\_______)|/     \\||/     \|\n\n`))

  client.disable()
  client.state = 'login-name'
  client.write(`Name? ` + chalk.styles.blue.open)
  client.enable()
})

server.listen(9000)
