const net = require('net')
const ansi = require('./ansi')
const chalk = require('chalk')
const commands = require('./commands')

let clients = []

let server = net.createServer(client => {
  client.setKeepAlive(true, 500)
  client.setTimeout(3000)
  client.setEncoding('utf8')

  client.name = (client.remoteAddress || client.localAddress) + ':' + (client.remotePort || client.localPort)

  clients.push(client)

  // Disable LINEMODE (enable charmode) on the client
  client.write(new Buffer([ 255, 251, 1 ]))  // IAC WILL ECHO
  client.write(new Buffer([ 255, 251, 3 ]))  // IAC WILL SUPRESS_GO_AHEAD
  client.write(new Buffer([ 255, 252, 34 ])) // IAC WONT LINEMODE

  client.currentIndex = 0
  client.currentLine = ''
  client.lines = []

  client.broadcast = message => {
    for (let sock of clients) {
      if (sock !== client) {
        sock.lines.push(message)
        sock.redraw()
      }
    }

    console.log('broadcast:', message)
  }

  client.redraw = () => {
    client.write(ansi.clearScreen() + ansi.clearLine())
    client.write(client.lines.join(`\n${ansi.clearLine()}`))
    client.write(`\n${ansi.clearLine()}`)
    client.write(highlight(client.currentLine))
    client.write(ansi.left(client.currentLine.length))
    if (client.currentIndex > 0) client.write(ansi.right(client.currentIndex))
  }

  client.on('data', data => {
    let str = data.toString()

    if (str === '\x7F') {
      // Backspace
      client.currentLine = client.currentLine
        .substr(0, client.currentIndex - 1) + client.currentLine
        .substr(client.currentIndex)
      if (client.currentIndex > 0) client.currentIndex--
    } else if (str === '\u001b[D') {
      // Left
      if (client.currentIndex > 0) client.currentIndex--
    } else if (str === '\u001b[C') {
      // Right
      if (client.currentIndex < client.currentLine.length) client.currentIndex++
    } else if (str === '\r\u0000') {
      // Newline
      if (command(...parse(client.currentLine)) === false) return
      client.currentLine = ''
      client.currentIndex = 0
    } else if (/^[\x00-\xFF]$/.test(str)) {
      // ASCII char
      client.currentLine += data.toString()
      client.currentIndex++
    } else {
      // wat?
      console.dir(str)
    }

    client.redraw()
  })

  client.on('end', () => {
    // Remove the client when it leaves
    client.broadcast(client.name + ' left')
    clients.splice(clients.indexOf(client), 1)
  })

  // Process a command + args set
  function command(cmd, ...args) {
    console.log(cmd, args)

    client.lines.push(highlight([cmd, ...args].join(' ')))

    if (cmd in commands) {
      return commands[cmd](client, ...args)
    } else {
      client.lines.push(chalk.red(`Unknown command ${chalk.bold(cmd)}`))
    }
  }

  // Parse a command+args string into array
  function parse(str) {
    // kek
    return str.split(' ')
  }

  // Highlight a string based on the command
  function highlight(ln) {
    let parts = parse(ln)
    let cmd = parts[0] in commands
      ? chalk.cyan.bold(parts[0])
      : chalk.red.bold(parts[0])
    let args = parts.splice(1)

    return [cmd, ...args].join(' ')
  }
})

server.listen(9000)
