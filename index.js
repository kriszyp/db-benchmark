'use strict';
const { Worker, isMainThread, parentPort, threadId } = require('worker_threads');
const { isMaster, fork } = require('cluster');

var crypto = require('crypto');
var path = require('path');
var testDirPath = path.resolve(__dirname, './benchdata');

var fs =require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var benchmark = require('benchmark');
var suite = new benchmark.Suite();
var levelup = require('levelup')
var leveldown = require('leveldown')

var leveldb = levelup(leveldown('./leveldb'))


const redis = require("redis");
const client = redis.createClient();

client.on("error", function(error) {
  console.error(error);
});



var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
var putStmt, getStmt, insertStmt



const { open, lmdbNativeFunctions } = require('lmdb');
var env;
var dbi;
var keys = [];
var total = 100;
var store
let data = {
  name: 'test',
  greeting: 'Hello, World!',
  flag: true,
  littleNum: 3,
  biggerNum: 32254435,
  decimal:1.332232,
  bigDecimal: 3.5522E102,
  negative: -54,
  aNull: null,
  more: 'string',
}

var c = 0
let result

let iteration = 1
function setData(deferred) {
/*  result = store.transactionAsync(() => {
    for (let j = 0;j<100; j++)
      store.put((c += 357) % total, data)
  })*/
  let key = (c += 357) % total
  result = store.put(key, data)
  /*if (key % 2 == 0)
    result = store.put(key, data)
  else
    result = store.transactionAsync(() => store.put(key, data))*/
  if (iteration++ % 1000 == 0) {
      setImmediate(() => deferred.resolve(result))
  } else
    deferred.resolve()
}
const MAX_OUTSTANDING = 100
let outstandingOps = 0
function setDataLevel(deferred) {
  let key = (c += 357) % total
  let waitingForDeferred
  leveldb.put(key, JSON.stringify(data), (error) => {
    outstandingOps--
    if (error)
      console.error(error)
    if (waitingForDeferred)
      waitingForDeferred.resolve()
  })
  if (outstandingOps++ < MAX_OUTSTANDING) {
    deferred.resolve()
  } else {
    waitingForDeferred = deferred
  }
}

function getDataLevel(deferred) {
  let key = (c += 357) % total
  let waitingForDeferred
  leveldb.get(key,(error,value) => {
    outstandingOps--
    if (error)
      console.error(error)
    result = JSON.parse(value)
    if (waitingForDeferred)
      waitingForDeferred.resolve()
  })
  if (outstandingOps++ < MAX_OUTSTANDING) {
    deferred.resolve()
  } else {
    waitingForDeferred = deferred
  }
}


function setDataRedis(deferred) {
  let key = (c += 357) % total
  let waitingForDeferred
  
  client.set(key, JSON.stringify(data), (error) => {
    outstandingOps--
    if (error)
      console.error(error)
    if (waitingForDeferred)
      waitingForDeferred.resolve()
  })
  if (outstandingOps++ < MAX_OUTSTANDING) {
    deferred.resolve()
  } else {
    waitingForDeferred = deferred
  }
}

function getDataRedis(deferred) {
  let key = (c += 357) % total
  let waitingForDeferred
  client.get(key,(error,value) => {
    outstandingOps--
    if (error)
      console.error(error)
    result = JSON.parse(value)
    if (waitingForDeferred)
      waitingForDeferred.resolve()
  })
  if (outstandingOps++ < MAX_OUTSTANDING) {
    deferred.resolve()
  } else {
    waitingForDeferred = deferred
  }
}


function setDataSqlite(deferred) {
  let key = (c += 357) % total
  let waitingForDeferred
  
  putStmt.run([2,3,4,5,6,7,8,9,10, key], (error, v) => {
    outstandingOps--
    if (error)
      console.error(error)
    if (waitingForDeferred)
      waitingForDeferred.resolve()
  })
  if (outstandingOps++ < MAX_OUTSTANDING) {
    deferred.resolve()
  } else {
    waitingForDeferred = deferred
  }
}
function getDataSqlite(deferred) {
  let key = (c += 357) % total
  let waitingForDeferred
  
  getStmt.get([key], (error, v) => {
    outstandingOps--
    if (error)
      console.error(error)
    result = v
    if (waitingForDeferred)
      waitingForDeferred.resolve()
  })
  if (outstandingOps++ < MAX_OUTSTANDING) {
    deferred.resolve()
  } else {
    waitingForDeferred = deferred
  }
}


function getData() {
  result = store.get((c += 357) % total)
}
function getBinary() {
  result = store.getBinary((c += 357) % total)
}
function getBinaryFast() {
  result = store.getBinaryFast((c += 357) % total)
}
function getRange() {
  let start = (c += 357) % total
  let i = 0
  for (let entry of store.getRange({
    start,
    end: start + 10
  })) {
    i++
  }
}
let jsonBuffer = JSON.stringify(data)
function plainJSON() {
  result = JSON.parse(jsonBuffer)
}

if (isMainThread && isMaster) {
var inspector = require('inspector')
//inspector.open(9330, null, true); debugger

function cleanup(done) {
  // cleanup previous test directory
  rimraf(testDirPath, function(err) {
    if (err) {
      return done(err);
    }
    // setup clean directory
    mkdirp(testDirPath).then(() => {
      done();
    }, error => done(error));
  });
}
async function setup() {
  console.log('opening', testDirPath)
  let rootStore = open(testDirPath, {
    noMemInit: true,
    //winMemoryPriority: 4,
  })
  store = rootStore.openDB('testing', {
    create: true,
    sharedStructuresKey: 100000000,
    keyIsUint32: true,    
  })
  let lastPromise
  await new Promise(resolve => db.run("CREATE TABLE test (id INTEGER NOT NULL PRIMARY KEY, b INTEGER, c INTEGER, d INTEGER, e INTEGER, f INTEGER, g INTEGER, h INTEGER, i INTEGER, j INTEGER)", resolve));
  await new Promise(resolve => insertStmt = db.prepare("INSERT INTO test VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", resolve));
  await new Promise(resolve => putStmt = db.prepare("UPDATE test SET b = ?, c = ?, d = ?, e = ?, f = ?, g = ?, h = ?, i = ?, j = ? WHERE id = ?", resolve));
  await new Promise(resolve => getStmt = db.prepare("SELECT id, b, c, d, e, f, g, h, i, j FROM test WHERE id = ?", resolve));
  let lastSqlPromise
  for (let i = 0; i < total; i++) {
    lastPromise = store.put(i, data)
    lastSqlPromise = new Promise(resolve => insertStmt.run([i,2,3,4,5,6,7,8,9,10], resolve))
  }
  await lastSqlPromise
  
  return lastPromise.then(() => {
    console.log('setup completed');
  })

}
var txn;

cleanup(async function (err) {
    if (err) {
        throw err;
    }
    await setup();
    suite.add('put redis', {
      defer: true,
      fn: setDataRedis
    });
    suite.add('get redis', {
      defer: true,
      fn: getDataRedis
    });

    suite.add('put level', {
      defer: true,
      fn: setDataLevel
    });
    suite.add('get level', {
      defer: true,
      fn: getDataLevel
    });
    suite.add('put sqlite', {
      defer: true,
      fn: setDataSqlite
    });
    suite.add('get sqlite', {
      defer: true,
      fn: getDataSqlite
    });
    suite.add('put', {
      defer: true,
      fn: setData
    });
    suite.add('get', getData);
    suite.add('plainJSON', plainJSON);
    suite.add('getBinary', getBinary);
    suite.add('getBinaryFast', getBinaryFast);
    suite.add('getRange', getRange);

    suite.on('cycle', function (event) {
      console.log({result})
      if (result && result.then) {
        let start = Date.now()
        result.then(() => {
          console.log('last commit took ' + (Date.now() - start) + 'ms')
        })
      }
      console.log(String(event.target));
    });
    suite.on('complete', async function () {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        return
        var numCPUs = require('os').cpus().length;
        console.log('Test opening/closing threads ' + numCPUs + ' threads');
        for (var i = 0; i < numCPUs; i++) {
          var worker = new Worker(__filename);
          await new Promise(r => setTimeout(r,30));
          worker.terminate();
          if ((i % 2) == 0)
            await new Promise(r => setTimeout(r,30));
          //var worker = fork();
        }
        console.log('Now will run benchmark across ' + numCPUs + ' threads');
        for (var i = 0; i < numCPUs; i++) {
          var worker = new Worker(__filename);

          //var worker = fork();
        }
    });

    suite.run({ async: true });

});
} else {
  let rootStore = open(testDirPath, {
    noMemInit: true,
    //winMemoryPriority: 4,
  })
  store = rootStore.openDB('testing', {
    sharedStructuresKey: 100000000,
    keyIsUint32: true,    
  })

  // other threads
    suite.add('put', {
      defer: true,
      fn: setData
    });
    suite.add('get', getData);
    suite.add('getBinaryFast', getBinaryFast);
    suite.on('cycle', function (event) {
      if (result && result.then) {
        let start = Date.now()
        result.then(() => {
          console.log('last commit took ' + (Date.now() - start) + 'ms')
        })
      }
      console.log(String(event.target));
    });
    suite.run({ async: true });

}
