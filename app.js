"use strict";
import http from 'http';
import express from "express";
import path from 'path';
import favicon from 'serve-favicon';
import bodyParser from 'body-parser';
import validator from 'express-validator';
import morgan from 'morgan';
import FileStreamRotator  from 'file-stream-rotator';
import fs from 'fs';
import ejs from 'ejs';
import {exec} from 'child_process';
import routes from './routes/index';

require('./common/helper');
const app = express();

h.rootpath = path.join(__dirname);

app.set('port', process.env.PORT || 3001);

//静态资源 与 视图
app.use(favicon(path.join(__dirname, '/public/images/butterfly.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/public/views'));
app.engine('.html', ejs.__express);
app.set('view engine', 'html');

//http request param resolve
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//req validator
app.use(validator());

//visit log 2 file.log daily
//ensure log directory exists
const logDirectory = path.join(__dirname, '/logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
//create a rotating write stream
const accessLogStream = FileStreamRotator.getStream( {
    filename: path.join(logDirectory, '/access-%DATE%.log'),
    date_format: "YYYY-MM-DD",//日期格式配合前边的DATE进行使用
    frequency: 'daily',// 频率
    verbose: false
});
// morgan print-format (combined common dev short tiny)
// sure, you also use custom print-format 
const logStyle = '[:date[iso]]: [":http-version"-":method"- ":url" :status ] ":user-agent" :response-time ms';
app.use(morgan(logStyle, {stream: accessLogStream}));
// app.use(morgan(logStyle));


// route set
routes(app);

//grunt apidoc
exec('grunt', (err, stdout, stderr) => {
    if(!err){
        console.log(stdout);
    }else{
        console.log(stderr);
        throw err;
    }
});

//404
app.use((req, res, next) => {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});


process.on('uncaughtException', err => console.error(err.stack));
process.on('unhandledRejection', (err, p) => console.error(err.stack));

let server = http.createServer(app).listen(app.get('port'), () => {
	let host = server.address().address;
	console.log("服务启动成功，访问地址为 http://%s:%s", host, app.get('port'));
});
