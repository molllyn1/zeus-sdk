var path = require('path');
var { requireBox, createDir } = require('@liquidapps/box-utils');
var { execScripts, emojMap } = requireBox('seed-zeus-support/_exec');
var compileCommand = requireBox('build-extensions/commands/compile');
var startEnv = requireBox('localenv-extensions/commands/start-localenv');
var cmd = 'migrate [contract]';

module.exports = {
  description: 'run migration scripts',
  builder: (yargs) => {
    yargs
      .option('compile-all', {
        describe: 'compile all contracts',
        default: true
      }).option('wallet', {
        describe: 'keosd wallet to use',
        default: 'zeus'
      }).option('creator-key', {
        describe: 'private key to set contract to',
        default: ''
      }).option('creator', {
        describe: 'eos account to set contract to',
        default: ''
      }).option('reset', {
        describe: 'reset local environment',
        default: true
      }).option('chain', {
        describe: 'chain to work on',
        default: 'eos'
      }).option('network', {
        describe: 'network to work on',
        default: ''
      })
      .option('services', {
        describe: 'service APIs to run',
        default: ''
      })
      // .option('verbose-rpc', {
      //   describe: 'verbose logs for blockchain communication',
      //   default: false
      // })
      .option('storage-path', {
        describe: 'path for persistent storage',
        default: path.join(require('os').homedir(), '.zeus')
      })
      .option('stake', {
        describe: 'account staking amount',
        default: '300.0000'
      }).example(`$0 ${cmd} --no-compile-all --no-reset`);
  },
  command: cmd,
  handler: async (args) => {
    if (args.creator == 'eosio' && args.network !== 'development') {
      // throw new Error(`must pass a creator when not using development network ${args.creator} ${args.network}`);
    }
    if(args.services) {
      args.services = args.services.split(',');
    }
    if (args.compileAll) {
      await compileCommand.handler(args);
    }
    if (args.reset) {
      await startEnv.handler(args);
    }
    createDir('migrations', 'migrations');
    global.chain = 'eos';
    try {
      await execScripts(path.resolve(__dirname, './migrate'), (script) => {
        console.log(emojMap.cloud + 'Migrator', path.basename(script).green);
        return [args];
      }, args);

      await execScripts(path.resolve('./zeus_boxes/migrations'), (script) => {
        console.log(emojMap.cloud + 'Migration', path.basename(script).cyan);
        return [args];
      }, args);
    }
    catch (e) {
      if((typeof(e) == "object" ? JSON.stringify(e) : e).includes('does not have signatures for it')) {
        console.log(`${emojMap.bangbang} must import key first with "zeus key import" or provide with "--creator-key"`)
      }
      console.log(emojMap.white_frowning_face + 'Migration failed');
      throw e;
    }
    console.log(emojMap.ok + 'Done migrating');
  }
};
