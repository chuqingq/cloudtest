// 1. 先设置支持跨域
// 2. 拼接一个collection.json，用newman.run(json, {reporter: 'json'})来获取结果，并返回
// 去掉对json-server的依赖，自己读写文件

var fs = require('fs');

var express = require('express');
var session = require('express-session')
var bodyParser = require('body-parser');
var newman = require('newman');

const COLLECTION_JSON = './LFS.postman_collection.json';

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'chuqq',
    resave: false,
    saveUninitialized: false
    // cookie TODO 是否要设置maxAge
}));

app.get('/', function(req, res) {
    console.log('/:');
    if (!req.session.username) {
        res.redirect('/login.html');
        return;
    }
    res.redirect('/index.html');
});
app.post('/api/login', function(req, res) {
    console.log('/api/login username: ' + req.body.username);
    console.log('/api/login password: ' + req.body.password);
    // TODO 校验用户
    req.session.username = req.body.username;
    req.session.save();
    res.json({});
});
app.post('/api/logout', function(req, res) {
    console.log('/api/logout username: ' + req.session.username);
    if (!req.session.username) {
        console.log('/api/logout not longined');
        res.json({ret: 400, msg: 'not logined'});
        return;
    }
    req.session.username = false;
    res.json({});
});
// 获取数据
app.get('/api/get', function(req, res) {
    console.log('/api/get:');
    var content = fs.readFileSync(COLLECTION_JSON);
    res.send(content);
});
// 保存所有数据
app.post('/api/saveall', function(req, res) {
    console.log('/api/saveall: ');
    // 需要Content-Type是application/json
    var output = JSON.stringify(req.body, null, '  ');
    console.log('output: ' + output);
    fs.writeFileSync(COLLECTION_JSON, output);
    res.send({});
});
// 运行一个请求
app.post('/api/run', function(req, res) {
    // 请求的body是个request，响应的body是response
    console.log('/api/run: ' + req.body.method + ' ' + req.body.name);
    var collection = {
        "variables": [],
        "info": {
            "name": "LFS",
            "_postman_id": "21bc3569-1f52-dd22-eeef-671dd971a9ca",
            "description": "",
            "schema": "https://schema.getpostman.com/json/collection/v2.0.0/collection.json"
        },
        "item": []
    };
    collection.item = [req.body];
    // console.log('==== collection: ' + JSON.stringify(collection, null, '  '));

    newman.run({
        collection: collection,
        reporters: 'json'
    }, function(err, res2) {
        console.log('newman.run err: ', err, ' res: ', res2);
        if (err) {
            console.log('newman.run error: ', err); /*TODO 返回错误*/
        }
        res.send(res2.run.executions[0].response);
    });
});
// html文件
app.use(express.static('./'));

app.listen(8080);
