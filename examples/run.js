var path = require('path');
var spawn = require('child_process').spawn;
var demoName = process.argv[2] || '';
var demoPath = path.resolve(__dirname, demoName);
var proc;
var procEnv = {
  PORT: process.argv[3] || 3000
};

for (var key in process.env) {
  procEnv[key] = process.env[key];
}

if (! demoName) {
  console.log('No demo specified, specify demoname to run the demo');
  process.exit(1);
}

console.log('## installing deps for ' + demoName + ' demo');

// install required modules
proc = spawn('npm', ['install'], {
  cwd: demoPath,
  stdio: ['ignore', 1, 2]
});

proc.on('close', function() {
  console.log('\n## starting ' + demoName + ' demo');
  spawn('node', ['server.js'], {
    cwd: demoPath,
    env: procEnv,

    stdio: ['ignore', 1, 2]
  });
});
