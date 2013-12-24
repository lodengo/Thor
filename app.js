var Api = require("./api.js");
var async = require('async');
var util = require("./util.js");

function Tester() {
	this.file = ''; // cost file id
	this.costs = {
		'整体工程' : [],
		'单项工程' : [],
		'单位工程' : [],
		'分部分项' : [],
		'清单' : [],
		'定额' : [],
		'工料机' : []
	};	
	this.stats = {
		totalms : 0,
		steps : 0,
		avgms : 0,
		maxms : 0
	};
}

Tester.prototype.costParent = function(type) {
	var me = this;
	var types = Object.keys(me.costs);
	if (type == types[0]) {
		return null;
	} else {
		var idx = types.indexOf(type);
		if (idx > 0) {
			var parentType = types[idx - 1];
			var parentId = me.costs[parentType].random();
			return parentId;
		} else {
			return null;
		}
	}
}

Tester.prototype.createCost = function(data, callback) {
	var me = this;
	var file = this.file;
	var type = data.type
	var parentId = this.costParent(type);
	if (type == '工料机') {
		data.type = [ "人工", "材料", "机械" ].random();
	}
	
	Api.createCost(file, data, parentId, function(err, cost) {
		me.costs[type].push(cost.id);
		callback(err, cost);
	});
}

Tester.prototype.createFile = function(callback) {
	var me = this;
	Api.createCostFile({}, function(err, file) {
		me.file = file;
		callback(null, file);
	});
}

Tester.prototype.createZtgc = function(callback) {	
	var data = {
		type : '整体工程'
	};
	this.createCost(data, callback);
}

Tester.prototype.createDXgc = function(callback) {	
	var data = {
		type : '单项工程'
	};
	this.createCost(data, callback);
}

Tester.prototype.createDwgc = function(callback) {	
	var data = {
		type : '单位工程'
	};
	this.createCost(data, callback);	
}

Tester.prototype.createFbfx = function(callback) {	
	var data = {
		type : '分部分项'
	};
	this.createCost(data, callback);	
}

Tester.prototype.createQd = function(callback) {	
	var data = {
		type : '清单',
		quantity : Math.random() * 1000
	};
	this.createCost(data, callback);
}

Tester.prototype.createDe = function(callback) {	
	var data = {
		type : '定额',
		quantity : Math.random() * 1000
	};
	this.createCost(data, callback);
}

Tester.prototype.createGlj = function(callback) {	
	var data = {
		'type' : '工料机',
		'price' : Math.random() * 100,
		'content' : Math.random()
	};
	this.createCost(data, callback);
}
// //////////////////////////////////////////////////////
Tester.prototype.step = function(startAt, action) {
	var me = this;
	var ms = new Date() - startAt;
	console.log([ action, ms ]);
	me.stats.totalms += ms;
	me.stats.steps += 1;
	me.stats.avgms = me.stats.totalms / me.stats.steps;
	me.stats.maxms = ms > me.stats.maxms ? ms : me.stats.maxms;
}

Tester.prototype.run = function(actions) {
	var me = this;
	async.eachSeries(Object.keys(actions), function(action, cb) {
		var n = actions[action];
		async.timesSeries(n, function(n, next) {
			var startAt = new Date();
			me[action].apply(me, [ function(err, res) {
				me.step(startAt, action);
				next(err, res);
			} ]);
		}, function(err, results) {
			cb(err);
		});
	}, function(err) {
		if (err)
			console.log([ 'err:', err ]);
		console.log('done');
		console.log(me.stats);
		console.log(util.dbstats.stats());
	});
}

// ////////////////////////////////
var tester = new Tester();
var actions = {
	createFile : 1,
	createZtgc : 1,
	createDXgc : 2,
	createDwgc : 4,
	createFbfx : 8,
	createQd : 1600,
	createDe : 3200,
	createGlj : 6400
};
tester.run(actions);
