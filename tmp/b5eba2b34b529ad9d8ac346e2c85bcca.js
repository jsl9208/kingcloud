var express      = require('express');
var app          = express();
var port         = Number(process.env.PORT || 13141);
var bodyParser   = require('body-parser');
var mongo        = require('mongodb');
var _            = require('underscore');
var crypto       = require('crypto');
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var basicAuth    = require('basic-auth');
var fs           = require('fs'); 
var multer       = require('multer');
var path         = require('path');

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === 'admin' && user.pass === 'admin') {
    return next();
  } else {
    return unauthorized(res);
  };
};
var ObjectId     = mongo.ObjectID;
var mongoUri     = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/cloud';
var Db           = mongo.Db;
mongo.MongoClient.connect(mongoUri, function(err, db) {
  if(!err) {
    console.log("DB connected");
    Db = db;
    fs.readFile('data.txt', function (err, data) {
      var arr = data.toString().split('\n');
      var res = [];
      arr.forEach(function (item, index) {
        var tmp = item.split('\t');
        res[index] = {
          name: tmp[0],
          email: tmp[1]
        };
      });
      Db.collection('user', function (err, collection) {
        res.forEach(function (item, index) {
          if (err) res.json({status: 0, error: '服务器忙，请稍后再试'});
          else {
            collection.findOne({email: item.email}, function (err, doc) {
              if (!doc) {
                doc = _.clone(userModel);
                doc.email = item.email;
                var sha1 = crypto.createHash('sha1');
                sha1.update('password');
                doc.password = sha1.digest('hex');
                doc.username = item.name;
                doc.joinDate = (new Date()).getTime();
                collection.insert(doc, function () {
                });
              }
              else {
//                doc.account = 1000;
//                doc.servers = [{
//                  cpu: 1,
//                  mem: 1,
//                  hdd: 40,
//                  band: 10,
//                  lastStartDate: (new Date()).getTime(),
//                  lastStartDateFormat: formatDate((new Date()).getTime()),
//                  expireDate: (new Date()).dateAdd('m', 12).getTime(),
//                  expireDateFormat: formatDate((new Date()).dateAdd('m', 12).getTime()),
//                  buyDate: (new Date()).getTime(),
//                  buyDateFormat: formatDate((new Date()).getTime()),
//                  system: 'Ubuntu 12.04 64bit',
//                  name: '',
//                  status: 0
//                }];
                doc.storage = {
                  data: [],
                  remain: 2*1024*1024*1024
                };
                collection.save(doc);
//                  fs.mkdirSync('upload/' + doc._id);
              }
            });
          }
        });
      });
    });
  } else throw err;
});
var emptyCB = function () {}
Date.prototype.dateAdd = function(interval,number) { 
  var d = this; 
  var k={'y':'FullYear', 'q':'Month', 'm':'Month', 'w':'Date', 'd':'Date', 'h':'Hours', 'n':'Minutes', 's':'Seconds', 'ms':'MilliSeconds'}; 
  var n={'q':3, 'w':7}; 
  eval('d.set'+k[interval]+'(d.get'+k[interval]+'()+'+((n[interval]||1)*number)+')'); 
  return d; 
} 
var formatDate = function (rawDate) {
  var date = new Date(rawDate);
  return date.getFullYear() + '/' + ((date.getMonth() + 1) < 10 ? ('0' + (date.getMonth() + 1)) : (date.getMonth() + 1)) + '/' + (date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate()) + ' ' + (date.getHours() < 10 ? ('0' + date.getHours()) : date.getHours()) + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ':' + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
}
function mkdirsSync(dirpath, mode) { 
    if (!fs.existsSync(dirpath)) {
        var pathtmp;
        dirpath.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            }
            else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true; 
}
var constants = {
	title: {
		'dashboard': '总览',
		'instances': '云主机',
		'keypairs': 'SSH密钥',
        'buyserver': '选购云主机',
        'storage': '云存储',
        'admin': '管理'
	}
}
var userModel = {
  email: '',
  username: '',
  password: '',
  avatar: '',
  joinDate: '',
  servers: [],
  storage: {}
}
var serverModel = {
  cpu: '',
  mem: '',
  hdd: '',
  band: '',
  lastStartDate: 0,
  lastStartDateFormat: 0,
  expireDate: '',
  expireDateFormat: '',
  buyDate: '',
  buyDateFormat: '',
  system: '',
  name: '',
  status: 0
}
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(multer({ dest: './tmp/'}));
app.use(cookieParser());
app.use(session({ 
    secret: 'keyboard cat', 
    key: 'sid', 
    cookie: { secure: false }
}));
app.get('/', function (req, res) {
  res.render('index');
});

app.get('/dashboard', function (req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
	res.render('dashboard', {page: 'dashboard', constants: constants, user: req.session.user});
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function (req, res) {
  var data = req.body;
  Db.collection('user', function (err, collection) {
    if (err) res.json({status: 0, error: '服务器忙，请稍后再试'});
    else {
      collection.findOne({email: data.email}, function (err, doc) {
        if (doc) {
          var sha1 = crypto.createHash('sha1');
          sha1.update(data.password);
          var password = sha1.digest('hex');
          if (password === doc.password) {
            req.session.user = doc;
            res.json({status: 1});
          }
          else {
            res.json({status: 0, error: '用户名或密码错误'});
          }
        }
        else {
          res.json({status: 0, error: '用户名或密码错误'});        }
      });
    }
  });
});

app.post('/register', function (req, res) {
  var data = req.body;
  Db.collection('user', function (err, collection) {
    if (err) res.json({status: 0, error: '服务器忙，请稍后再试'});
    else {
      collection.findOne({email: data.email}, function (err, doc) {
        if (!doc) {
          doc = _.clone(userModel);
          doc.email = data.email;
          var sha1 = crypto.createHash('sha1');
          console.log(data);
          sha1.update(data.password);
          doc.password = sha1.digest('hex');
          doc.username = data.username;
          doc.joinDate = (new Date()).getTime();
          collection.insert(doc, function () {
            collection.findOne({email: doc.email}, function (err, doc) {
              req.session.user = doc;
              res.json({status: 1});
            });
          });
        }
        else {
          res.json({status: 0, error: '该邮箱已被使用'});
        }
      });
    }
  });
});

app.get('/instances', function (req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
	res.render('instances', {page: 'instances', constants: constants, user: req.session.user});
});

app.get('/keypairs', function (req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
	res.render('keypairs', {page: 'keypairs', constants: constants, user: req.session.user});
});

app.get('/storage', function (req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('storage', {page: 'storage', constants: constants, user: req.session.user});
});
app.get('/shop/:type', function (req, res) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  var type = req.param('type');
  var page = 'buy' + type;
  res.render(page, {page: page, constants: constants, user: req.session.user});
});

app.post('/buyserver', function (req, res) {
  if (!req.session.user) {
    return res.json({status: 0, error: '验证错误，请重新登录！'});
  }
  var data = req.body;
  var date = (new Date()).getTime();
  var exDate = (new Date()).dateAdd('m', data.month).getTime();
  for (var i = 0; i < data.amount; ++i) {
    var server = _.clone(serverModel);
    server.buyDate = date;
    server.buyDateFormat = formatDate(date);
    server.expireDate = exDate;
    server.expireDateFormat = formatDate(exDate);
    server.cpu = data.cpu;
    server.mem = data.mem;
    server.hdd = data.hdd;
    server.band = data.band;
    server.system = data.system;
    req.session.user.servers.push(server);
  }
  req.session.user._id = new ObjectId(req.session.user._id);
  Db.collection('user', function (err, collection) {
    collection.save(req.session.user, function () {
      res.json({status: 1});
    })
  });

});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/login');
});

app.post('/server/control', function (req, res) {
  if (!req.session.user) {
    return res.json({status: 0, error: '验证错误，请重新登录！'});
  }
  var data = req.body;
  var date = (new Date()).getTime();
  var lastStartDateFormat = {};
  if (typeof(data['id[]']) != 'object') data['id[]'] = [data['id[]']];
  console.log(data);
  for (var i in data['id[]']) {
    var id = data['id[]'][i];
    if (data.type == 'start' || data.type == 'restart') {
      if (data.type == 'start' && req.session.user.servers[id].status == 1) {
        lastStartDateFormat[id] = req.session.user.servers[id].lastStartDateFormat;
      }
      else {
        req.session.user.servers[id].status = 1;
        req.session.user.servers[id].lastStartDate = date;
        req.session.user.servers[id].lastStartDateFormat = formatDate(date);
        lastStartDateFormat[id] = req.session.user.servers[id].lastStartDateFormat;
      }
    }
    else if (data.type == 'stop') {
      req.session.user.servers[id].status = 0;
    }
  }
  req.session.user._id = new ObjectId(req.session.user._id);
  Db.collection('user', function (err, collection) {
    collection.save(req.session.user, function (err) {
      if (err) console.log(err);
      res.json({status: 1, lastStartDateFormat: lastStartDateFormat});
    })
  });
});

app.get('/api/getData', function (req, res) {
  Db.collection('user', function (err, collection) {
    collection.find().toArray(function (err, docs) {
      res.json(docs);
    });  
  });
});

app.get('/api/getStorageData', function (req, res) {
  if (!req.session.user) {
    return res.json({status: 0, error: '验证错误，请重新登录！'});
  }
  Db.collection('user', function (err, collection) {
    collection.findOne({_id: new ObjectId(req.session.user._id)}, function (err, doc) {
      req.session.user = doc;
      res.json(doc.storage);
    });
  });
});
app.post('/upload', function (req, res) {
  var file = req.files.file;
  var src = file.path;
  var tmpPath = './upload/' + req.session.user._id + req.body.path;
  mkdirsSync(tmpPath);
  fs.linkSync(src, tmpPath + file.originalname);
  res.send('ok');
});
app.post('/api/saveStorageTree', function (req, res) {
  if (!req.session.user) {
    return res.json({status: 0, error: '验证错误，请重新登录！'});
  }
  Db.collection('user', function (err, collection) {
    collection.findOne({_id: new ObjectId(req.session.user._id)}, function (err, doc) {
      doc.storage = req.body.data;
      collection.save(doc, function () {
        req.session.user = doc;
        res.send('ok');
      })
    });
  });
});

app.get('/admin', auth, function (req, res) {
  Db.collection('user', function (err, collection) {
    collection.find().toArray(function (err, docs) {
      res.render('admin', {users: docs, constants: constants, page: 'admin'});
    });  
  });
});

app.listen(port);