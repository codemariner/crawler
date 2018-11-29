const nconf = require('nconf-pro')
const path = require('path')

const conf = (new nconf.Provider()).argv().env('__')
const currentEnv = conf.get('NODE_ENV') || 'development';

['local', currentEnv, 'default'].forEach((env) => {
  conf.use(env, {
    type: 'file',
    file: path.join(__dirname, `${env}.json5`),
  })
})

module.exports = conf
