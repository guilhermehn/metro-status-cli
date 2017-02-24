#!/usr/bin/env node
const chalk = require('chalk')
const https = require('https')

const colorMap = {
  'Azul': chalk.blue,
  'Verde': chalk.green,
  'Vermelha': chalk.red,
  'Amarela': chalk.yellow,
  'Lilás': chalk.magenta,
  'Prata': chalk.gray
}

function logError(err) {
  console.error('Ocorreu um erro:', err)
}

function removeColorName(name) {
  return name.replace(/-.+$/, '')
}

function getColorDot(name) {
  const colors = Object.keys(colorMap)

  for (let i = 0; i < colors.length; i++) {
    if (name.indexOf(colors[i]) > -1) {
      return colorMap[colors[i]].bold('\uA78F')
    }
  }

  return ' '
}

function getLineNumber(name) {
  return parseInt(name.match(/\d+/)[0])
}

function largestNameLength(data) {
  const names = data.map(item => removeColorName(item.name))
  let largest = 0

  names.forEach(name => {
    if (name.length > largest) {
      largest = name.length
    }
  })

  return largest
}

function formatData(data) {
  const largestLength = largestNameLength(data)
  data.sort((a, b) => getLineNumber(a.name) - getLineNumber(b.name))
  data = data.map(line => {
    const { name, status } = line
    const cleanName = removeColorName(name)
    line.name = ` ${getColorDot(name)} ${cleanName}${' '.repeat(Math.max(0, largestLength - cleanName.length))}`

    if (status.match(/reduzida/i)) {
      line.status = chalk.yellow(line.status)
    }

    return line
  })

  return data
}

function zeroPad(x, width = 2) {
  const padLength = Math.max(0, width - x.toString().length)
  return `${'0'.repeat(padLength)}${x}`
}

function formatDate(date) {
  const dateObj = new Date(date)

  return `${dateObj.getDate()}/${zeroPad(dateObj.getMonth())}/${dateObj.getFullYear().toString().substr(2, 2)}`
}

function logData(data) {
  console.log('')
  formatData(data.data).forEach(line => console.log(`${line.name}  ${line.status}`))
  console.log(`\n Atualizado em ${formatDate(data.date)}`)
}

function main() {
  https.get('https://metro-status.herokuapp.com/', res => {
    const { statusCode } = res
    const contentType = res.headers['content-type']
    let error;

    if (statusCode !== 200) {
      error = new Error(`Request Failed.\nStatus Code: ${statusCode}`)
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error(`Invalid content-type.\nExpected application/json but received ${contentType}`)
    }

    if (error) {
      logError(error)
      res.resume()
      return
    }

    let responseData = '';
    res.on('data', data => responseData += data)
    res.on('end', () => {
      try {
        const json = JSON.parse(responseData)
        logData(json)
      } catch(err) {
        logError(err)
      }
    })
  })
  .on('error', logError)
}

main()
