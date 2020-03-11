const chalk = require('chalk')
const fsextra = require('fs-extra')
const handlebars = require('handlebars')
const symbols = require('log-symbols')

function compileStr(filePath, answersContent) {
  return new Promise(function(resolve, reject) {
		fsextra.pathExists(filePath).then(exists => {
      if (exists) {
        const _filePath = filePath
        const _Content = fsextra.readFileSync(_filePath).toString()
        const _Result = handlebars.compile(_Content)(answersContent)
        fsextra.writeFileSync(_filePath, _Result)

        console.log(symbols.success, `${chalk.cyan(filePath)} configured successful.`)
        resolve()
      } else {
        console.log(symbols.error, `${chalk.red(filePath)} not found.`)
        return reject()
      }
    }).catch(err => {
      console.log(symbols.error, chalk.red(err))
    })
  })
}

module.exports = compileStr
