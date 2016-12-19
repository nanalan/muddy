const chalk = require('chalk')

module.exports = [
`${chalk.bold('- Human -')}
A human is adaptable. They aren't particularly great at anything. Humans are the only race that can change class easily.

${chalk.green(' + Archer')}
${chalk.green(' + Mage')}
${chalk.green(' + Thief')}
${chalk.green(' + Warrior')}
${chalk.green(' + Illusionist')}
${chalk.green(' + Monk')}`,

`${chalk.bold('- Elf -')}
These are nimble, wise, and beautiful beings. They resemble Humans, except for their small frame and pointed ears.

${chalk.green.bold('++ Archer')}
${chalk.green.bold('++ Mage')}
${chalk.green(     ' + Thief')}
${chalk.green(     ' + Warrior')}
${chalk.red(       ' - Illusionist')}
${chalk.red.bold(  '-- Monk')}`,

`${chalk.bold('- Dwarf -')}
Dwarves are tough; they can take hundreds of hits. They are characterized by their large beards and small bodies. Dwarfs are very resistant to poison and disease, you won't find a sick Dwarf anywhere.

${chalk.green.bold('++ Monk')}
${chalk.green.bold('++ Warrior')}
${chalk.green(     ' + Mage')}
${chalk.red(       ' - Illusionist')}
${chalk.red.bold(  '-- Thief')}
${chalk.red.bold(  '-- Archer')}`,

`${chalk.bold('- Giant -')}
Giants are big, strong, sturdy, stupid, and ugly. They often have short tempers and are the best front-liners of any race. since they are disliked by most, Giants use the art of intimation to get their way, taking advantage of their fiercesome reputation.

${chalk.green.bold('++ Monk')}
${chalk.green.bold('++ Warrior')}
${chalk.green(     ' + Archer')}
${chalk.red.bold(  '-- Thief')}
${chalk.red.bold(  '-- Illusionist')}
${chalk.red.bold(  '-- Mage')}`
]
