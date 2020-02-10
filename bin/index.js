#!/usr/bin/env node

const program = require('commander')
const download = require('download-git-repo')
const handlebars = require('handlebars')
const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const fsextra = require('fs-extra')
const ora = require('ora')
const chalk = require('chalk')
const symbols = require('log-symbols')
const shell = require('child_process').exec

// version
program
  .version(require('../package').version,'-v, --version')

// init
program
  .name('vuepress-creator')
  .usage('<commands> [options]')
  .command('init <project>')
  .description('Create a VuePress project.')
  .action((projectName)=>{ 

    if(!fs.existsSync(projectName)){
      console.log(`The configuration in ${chalk.cyan('package.json')} don\'t affect the VuePress project very much.We will skip the configuration of package.json and keep the default value.Let\'s configure the basic functions of VuePress project now.`)

      inquirer
        .prompt([{
          type:'input',
          name:'basePath',
          message:'Where do you want to deploy your website:',
          default: '/' 
        },{
          type:'confirm',
          name:'lineNumbers',
          message:'Use the lineNumbers?',
          default: false
        },{
          type:'confirm',
          name:'editLinks',
          message:'Use the editLinks?',
          default: false
        },{
          type:'input',
          name:'getRepo',
          message:'Input your repo:',
          when: (answers) => {
            return answers.editLinks
          }
        },{
          type:'confirm',
          name:'useLess',
          message:'Use Less?',
          default: true
        },{
          type:'confirm',
          name:'useVuePress',
          message:'Do you have install global VuePress in your PC?',
          default: false
        },{
          type:'list',
          name:'pickManager',
          message:'Pick a package manager?',
          choices: [
            'npm',
            'yarn'
          ],
          default: 'yarn'
        }])
        .then(answers => {

          const templatePath = path.resolve(__dirname, '../template')
          const processPath = process.cwd() 
          const targetPath = `${processPath}\\${projectName}`
          if(fs.existsSync(templatePath)){
            fsextra.copy(templatePath, targetPath).then(() => {
              const packagePath = `${projectName}/package.json`
              const configPath = `${projectName}/docs/.vuepress/config.js`
              const configGather = {
                projectName,
                basePath: answers.basePath,
                lineNumbers: answers.lineNumbers,
                editLinks: answers.editLinks,
                getRepo: answers.editLinks ? answers.getRepo : null,
                useLess: answers.useLess ? `
    rules: [
      {
        test: /\\\.less$/,
        loader: \"less-loader\", // compiles Less to CSS
      },
    ]
                `:'// Add rules here'               
              }
              
              compileWrite(packagePath,configGather)
              compileWrite(configPath,configGather)

              const installSpinner = ora(chalk.cyan('Installing...'))
              installSpinner.start()

              let _mergeInstall = ''
              if (answers.useLess){
                _mergeInstall += 'less@2.7.3 less-loader'
              }
              if (!answers.useVuePress){
                _mergeInstall += ' vuepress'
              }
            
              if (_mergeInstall == ''){
                installSpinner.text = 'No dependencies need to be installed.'
                installSpinner.succeed()
              }else{
                let _pickManager = answers.pickManager
                switch(_pickManager){
                  case 'npm':
                    shell(`cd ${projectName} && npm install ${_mergeInstall} -save-dev`, (err, stdout, stderr) => {
                      if (err) {
                        installSpinner.text = 'Install failed.'
                        installSpinner.fail()
                        process.exit(1)
                      }
                      installSpinner.text = 'Install successful.'
                      installSpinner.succeed()
                      process.exit()
                    })
                    break
                  case 'yarn':
                    shell(`cd ${projectName} && yarn add ${_mergeInstall} --dev`, (err, stdout, stderr) => {
                      if (err) {
                        installSpinner.text = 'Install failed.'
                        installSpinner.fail()
                        process.exit(1)
                      }
                      installSpinner.text = 'Install successful.'
                      installSpinner.succeed()
                      process.exit()
                    })
                    break
                }
              }  
            }).catch(err => {
              console.error(err)
            })
          }else{
            console.log(`Please run the cmdline ${chalk.green('vuepress-creator upgrade -t')} before you create.`)
          }
        });
    }else{
      console.log(symbols.error, chalk.red('The project already exists.'))
    }
  })

// upgrade
program
  .command('upgrade')
  .requiredOption('-t, --template', 'upgrade type')
  .description('Upgrade the VuePress project template.')
  .action(()=>{
    const templatePath = path.resolve(__dirname, '../template')
    fsextra.emptyDir(templatePath).then(() => {
      downloadTemplate(templatePath)
    }).catch(err => {
      console.error(err)
    })
  })

program.on('--help', function(){
  console.log('');
  console.log('Examples:');
  console.log('  $ vuepress-creator init NewProject');
  console.log('  $ vuepress-creator upgrade -t');
  console.log('');
});

program.parse(process.argv)


function compileWrite(filePath,answersContent){
  const configSpinner = ora(chalk.cyan('Configuring...'))
  configSpinner.start()
  if(fs.existsSync(filePath)){
    const _filePath = filePath
    const _Content = fs.readFileSync(_filePath).toString()
    const _Result = handlebars.compile(_Content)(answersContent)
    fs.writeFileSync(_filePath,_Result)

    configSpinner.text = `${chalk.cyan(filePath)} configured successful.`
    configSpinner.succeed()
  }else{
    configSpinner.text = `${chalk.red(filePath)} not found.`
    configSpinner.fail()
  }
}

function downloadTemplate(downloadPath){
  const downloadSpinner = ora(chalk.cyan('Downloading template...'))
  const templateVersion = path.resolve(__dirname, '../template/package')
  downloadSpinner.start()

  download('https://github.com:seeyoz/vuepress-creator-template#master', downloadPath, { clone:true }, (err) => {
    if (err){
      downloadSpinner.text = chalk.red('Download template failed.')
      downloadSpinner.fail()
      return
    }else{
      downloadSpinner.text = 'Download template successful.'
      downloadSpinner.succeed()
      let _ver
      _ver = require(templateVersion).version
      console.log(chalk.yellow('Template version: '+_ver))
    }
  })
}
  