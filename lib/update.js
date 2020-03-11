const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

updateNotifier({pkg}).notify();

const notifier = updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60 * 24
})

function updateChk(){
  if (notifier.update) {
    console.log(`New version available: ${notifier.update.latest}, it's recommended that you update before using.`)
  }else{
    console.log('Already the latest version.')
  }
}

module.exports = updateChk

