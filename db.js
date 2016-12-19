require('dotenv').config()

const mongoose = require('mongoose')
const chalk = require('chalk')
const bcrypt = require('bcryptjs-then')

mongoose.Promise = Promise
const { Schema, ObjectId } = mongoose
const db = mongoose.connect(process.env.MONGO_URI)

const UserSchema = new Schema({
  name: { type: String, required: true, index: { unique: true } },
  pass: { type: String, required: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
  race: { type: String, required: true, enum: [
    'Human', 'Elf', 'Dwarf', 'Giant',
  ] },
  class: { type: String, required: true, enum: [
    'Warrior', 'Monk', 'Mage', 'Thief', 'Illusionist', 'Archer'
  ] }
})

UserSchema.pre('save', function(next) {
  if (!this.isModified('pass')) return next()

  bcrypt.hash(this.pass, 15)
    .then(hash => {
      this.pass = hash

      next()
    })
    .catch(next)
})

UserSchema.methods.checkPass = function(pass) {
  return bcrypt.compare(pass, this.pass)
}

UserSchema.methods.styled = function() {
  return style(this.gender, this.name)
}

UserSchema.methods.they = function() {
  if (this.gender === 'male') return 'he'
  if (this.gender === 'female') return 'she'
  return 'they'
}

UserSchema.methods.theirs = function() {
  if (this.gender === 'male') return 'his'
  if (this.gender === 'female') return 'hers'
  return 'theirs'
}

const style = (gender, name) => {
  if (gender === 'male') return chalk.bold.cyan(name)
  if (gender === 'female') return chalk.bold.magenta(name)
  return chalk.bold.yellow(name)
}

const User = mongoose.model('User', UserSchema)

module.exports = { db, User, style }
