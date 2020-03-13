#!/usr/bin/env node

const updateChk = require('../lib/update')
const downloadTpl = require('../lib/download')
const compileStr = require('../lib/compile')

const program = require('commander')
const inquirer = require('inquirer')
const fsextra = require('fs-extra')
const path = require('path')
const ora = require('ora')
const chalk = require('chalk')
const symbols = require('log-symbols')
const shell = require('child_process').exec

// version
program
  .version(require('../package.json').version, '-v, --version')

// upgrade
program
	.command('upgrade')
	.description("Check the VuePress-Creator's version.")
	.option('-t, --templete', 'Upgrade the VuePress templete version.')
	.action(() => {
    let _length = process.argv.slice(2).length
		if ( _length > 2) {
			program.outputHelp()
		} else {
      switch (_length){
        case 1:
          if (process.argv[2] == 'upgrade') {
            updateChk()
          }
          break
        case 2:
          if (process.argv[3] == '-t') {
            const templatePath = path.resolve(__dirname, '../template')
            fsextra.emptyDir(templatePath).then(() => {
              downloadTpl(templatePath)
            }).catch(err => {
              console.error(err)
            })
          }
          break
        default:
          program.outputHelp()
      }
		}
	})

// default templete
program
	.command('def <project>')
	.description('Initialize the default template for VuePress.')
	.action(project => {
		fsextra
			.pathExists(project)
			.then(exists => {
				if (!exists) {
					const templatePath = path.resolve(__dirname, '../template')
          const processPath = process.cwd()
          const targetPath = `${processPath}/${project}`
					fsextra.pathExists(templatePath).then(exists => {
						if (exists) {
							compileAction(project,templatePath,targetPath,{theme:null}).then(() => {
                showInfoAction(project)
              })
						} else {
							fsextra.emptyDir(templatePath).then(() => {
                downloadTpl(templatePath).then(() => {
                  compileAction(project,templatePath,targetPath,{theme:null}).then(() => {
                    showInfoAction(project)
                  })
                })
              }).catch(err => {
                console.error(err)
              })
						}
					})
				} else {
					console.log(symbols.error, chalk.red('The project already exists.'))
				}
			}).catch(err => {
				console.error(err)
			})
	})

// antdocs theme
program
	.command('ads <project>')
	.description('Initialize the template with AntDocs theme for VuePress.')
	.action(project => {
    fsextra
    .pathExists(project)
    .then(exists => {
      if (!exists) {
        const templatePath = path.resolve(__dirname, '../template')
        const processPath = process.cwd()
        const targetPath = `${processPath}/${project}`
        const stylePath = `${processPath}/${project}/docs/.vuepress/styles`
        fsextra.pathExists(templatePath).then(exists => {
          if (exists) {
            compileAction(project,templatePath,targetPath,{theme:'antdocs'}).then(() => {
              installThemeAction(project).then(()=>{
                fsextra.emptyDir(stylePath)
                showInfoAction(project)
              })
            })
          } else {
            fsextra.emptyDir(templatePath).then(() => {
              downloadTpl(templatePath).then(() => {
                compileAction(project,templatePath,targetPath,{theme:'antdocs'}).then(() => {
                  installThemeAction(project).then(()=>{
                    fsextra.emptyDir(stylePath)
                    showInfoAction(project)
                  })
                })
              })
            }).catch(err => {
              console.error(err)
            })
          }
        })
      } else {
        console.log(symbols.error, chalk.red('The project already exists.'))
      }
    }).catch(err => {
      console.error(err)
    })
  })

// init
program
	.name('vuepress-creator')
	.usage('<commands> [options]')
	.command('init <project>')
	.description('Create a VuePress project.')
	.action(project => {
    fsextra.pathExists(project).then(exists => {
      if (!exists) {
        inquirer.prompt([{
          type:'list',
          name:'theme',
          message:'Pick a theme for VuePress?',
          choices: [
            'Default',
            'AntDocs (Ant Design style)'
          ],
          default: 'Default'
        }]).then(answers => {
          let _theme = answers.theme == 'Default' ? null:'antdocs'
          const templatePath = path.resolve(__dirname, '../template')
          const processPath = process.cwd()
          const targetPath = `${processPath}/${project}`
          const stylePath = `${processPath}/${project}/docs/.vuepress/styles`
          switch (_theme){
            case null:
              fsextra.pathExists(templatePath).then(exists => {
                if (exists) {
                  compileAction(project,templatePath,targetPath,{theme:null}).then(() => {
                    showInfoAction(project)
                  })
                } else {
                  fsextra.emptyDir(templatePath).then(() => {
                    downloadTpl(templatePath).then(() => {
                      compileAction(project,templatePath,targetPath,{theme:null}).then(() => {
                        showInfoAction(project)
                      })
                    })
                  }).catch(err => {
                    console.error(err)
                  })
                }
              })
              break
            case 'antdocs':
              fsextra.pathExists(templatePath).then(exists => {
                if (exists) {
                  compileAction(project,templatePath,targetPath,{theme:'antdocs'}).then(() => {
                    installThemeAction(project).then(()=>{
                      fsextra.emptyDir(stylePath)
                      showInfoAction(project)
                    })
                  })
                } else {
                  fsextra.emptyDir(templatePath).then(() => {
                    downloadTpl(templatePath).then(() => {
                      compileAction(project,templatePath,targetPath,{theme:'antdocs'}).then(() => {
                        installThemeAction(project).then(()=>{
                          fsextra.emptyDir(stylePath)
                          showInfoAction(project)
                        })
                      })
                    })
                  }).catch(err => {
                    console.error(err)
                  })
                }
              })
              break
          }
        })        
      } else {
        console.log(symbols.error, chalk.red('The project already exists.'))
      }
    })
  })

program.on('--help', function() {
	console.log('')
	console.log('Examples:')
	console.log('  $ vuepress-creator init project')
	console.log('  $ vuepress-creator upgrade -t')
	console.log('')
})

program.parse(process.argv)


function compileAction(prjName,tplPath,tgrPath,cfgGather){
  return new Promise(function(resolve, reject) {
    fsextra.copy(tplPath, tgrPath).then(() => {
      const configPath = `${prjName}/docs/.vuepress/config.js`
      const configGather = cfgGather
      compileStr(configPath, configGather).then(() => {
        resolve()
      }).catch(err => {
        return err
      })
    }).catch(err => {
      return reject(err)
    })
  })
}

function installThemeAction(prjName){
  return new Promise(function(resolve, reject) {
    const installSpinner = ora(chalk.cyan('Install AntDocs theme...'))
    installSpinner.start()
    shell(`cd ${prjName} && npm i vuepress-theme-antdocs`, (err, stdout, stderr) => {
      if (err) {
        installSpinner.text = 'Install AntDocs theme failed.'
        installSpinner.fail()
        return reject(err)
      }
      installSpinner.text = 'Install AntDocs theme successful.'
      installSpinner.succeed()
      resolve()
    })
  })
}

function showInfoAction(prjName){
  console.log('')
  console.log('    To get started:')
  console.log('')
  console.log(chalk.yellow(`      cd ${prjName}`))
  console.log(`      ${chalk.yellow('npm install')} or ${chalk.yellow('yarn install')}`)
  console.log(`      ${chalk.yellow('npm run dev')} or ${chalk.yellow('yarn run dev')}`)
  console.log('')
}