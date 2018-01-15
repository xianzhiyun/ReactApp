/*
*1.express传入中间件,把中间件抽离一个单独文件,和use相关的进行拆分  保持入口文件的精简
*2.利用express.Router进行挂载
*3.中间件
* */
const express = require('express');
const Router = express.Router();
/*对密码进行加密*/
const utils = require('utility');
/*
* user.getModel进行操作的数据库
* 获取数据库的内容
* 获取模型
* */
const model = require('./model');
const User = model.getModel('user');

/*
* 内部使用,进行屏蔽内容信息,防止暴露
* */
const _fileter={'pwd':0,'_v':0};
/*
* 1.使用路由对象进行挂载Router.get,发囊
*
* */
Router.get('/list', function (req, res) {
	// User.remove({},function (err,doc) {});
	User.find({}, function (err, doc) {
		return res.json(doc)
	});
});
/*处理登录页*/
Router.post('/login', function (req, res) {
	const {user, pwd} = req.body;
	User.findOne({user, pwd: md5Pwd(pwd)},_fileter, function (err, doc) {
		if (!doc) {
			return res.json({code: 1, msg: '用户名或密码错误'});
		}
		//登录的时候进行验证成功后进行设置cookie,进行写入id
		res.cookie('userid', doc._id);
		return res.json({code: 0, data: doc});
	})
});
/*
*注册用post进行发送的请求
*body-parser进行接收post参数
*
* */
Router.post('/register', function (req, res) {
	//req.body 是传过来的数据
	// console.log(req.body);
	const {user, pwd, type} = req.body;
	User.findOne({user: user}, function (err, doc) {
		if (doc) {
			return res.json({code: 1, msg: "用户名重复"});
		}
		const userModal=new User({user,type,pwd:md5Pwd(pwd)});
		/*userModal.save可以返回生成后的id*/
		userModal.save(function(e,d){
			if(e){
				return res.json({code:1,msg:'后端出错了'});
			}
			/*进行对象结构*/
			const {user,type,_id}=d;
			/*进行写cookie*/
			res.cookie('userid',_id);
			return res.json({code:0,data:{user,type,_id}});
		});
		/*进行入库user.create不能返回生成后的id*/
		/*User.create({user, pwd: md5Pwd(pwd), type}, function (e, d) {
			if (e) {
				return res.json({code: 1, msg: '后端出错了'});
			}
			return res.json({code: 0});
		});*/
	});
});

/*
*1.获取用户的信息接口
*2.返回信息进行验证;
*
* */
Router.get('/info', function (req, res) {
	/*读取的时候的在request
	*对cookie进行校验
	*这里去获取cookie
	*读cookie是req.cookies,进行读取
	* res.cookies是进行写cookies
	*/

	const {userid} = req.cookies;
	/*
	* findByid 或者是findOne(),这里放第一个传入的参数
	* */
	User.findOne({_id: userid},_fileter, function (err, doc) {
		if (err) {
			return res.json({code: 1, msg: '后端出错了'});
		}
		if (doc) {
			//成功的进行返回数据的json格式
			return res.json({code: 0, data: doc});
		}
	});
});
/*加密在两MD5进行加密*/
function md5Pwd(pwd){
	const salt = 'welcome_come_china';
	return utils.md5(utils.md5(pwd + salt));
}
//暴露和use相关的接口   Router.get进行的挂载的接口进行返回
module.exports = Router;