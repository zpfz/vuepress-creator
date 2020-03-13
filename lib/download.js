const ora = require('ora')
const chalk = require('chalk')
const fsextra = require('fs-extra')
const path = require('path')
const download = require('download-git-repo')

function downloadTpl(downloadPath,templatePath) {
	return new Promise(function(resolve, reject) {
		const downloadSpinner = ora(chalk.cyan('Downloading template...'))
		const templateVersion = path.resolve(__dirname,'../template/package')
		const creatorVersion = require('../package.json')
		downloadSpinner.start()

		download('https://github.com:seeyoz/vuepress-template#master',downloadPath,{ clone: true },err => {
			if (err) {
				downloadSpinner.text = chalk.red('Download template failed.')
        downloadSpinner.fail()
        fsextra.remove(templatePath, err => {
          if (err) return console.error(err)
          console.log(`${chalk.yellow('WARNING:')}TEMPLATE folder has been revoked.`)
        })
				return reject(err)
			} else {
				downloadSpinner.text = 'Download template successful.'
				downloadSpinner.succeed()
				let _ver = require(templateVersion).version
				let _creator = require(templateVersion).creator.substring(2)
				console.log(chalk.yellow('Template version: ' + _ver))
				if (compareVersion(creatorVersion.version, _creator) == -1){
					console.log(chalk.red('VuePress-Creator\'s version is low, please upgrade to ' + _creator + ' or highest.'))
				}
				resolve()
			}
		})
	})
}

function compareVersion(ver_1, ver_2) {
  const arr1 = ver_1.split('.')
  const arr2 = ver_2.split('.')
  const length1 = arr1.length
  const length2 = arr2.length
  const minlength = Math.min(length1, length2)
  let i = 0
  for (i ; i < minlength; i++) {
    let a = parseInt(arr1[i])
    let b = parseInt(arr2[i])
    if (a > b) {
      return 1
    } else if (a < b) {
      return -1
    }
  }
  if (length1 > length2) {
    for(let j = i; j < length1; j++) {
      if (parseInt(arr1[j]) != 0) {
        return 1
      }
    }
    return 0
  } else if (length1 < length2) {
    for(let j = i; j < length2; j++) {
      if (parseInt(arr2[j]) != 0) {
        return -1
      }
    }
    return 0
  }
  return 0
}

module.exports = downloadTpl
