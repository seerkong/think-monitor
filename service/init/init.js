const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const updateConfig = (data) => {
	let config = {
			mysql: {
		    host: data.mysql_host,
		    port: data.mysql_port,
		    user: data.mysql_user,
		    password: data.mysql_password,
		    database: data.mysql_database,
			},
			influxDB: {
				influx_host: data.influx_host,
		    influx_port: data.influx_port,
			}
	}
	let content = `
		module.exports = ${JSON.stringify(config)};
	`;
  let srcPath = path.resolve('./service/init');
  fs.statSync(srcPath);
  let dbConfigFile = path.join(srcPath, 'db-config.js');
  fs.writeFileSync(dbConfigFile, content);
};


const initMySQL = async ({mysql_user, mysql_host, mysql_password, mysql_port, mysql_database}) => {
	try{
		let connection = mysql.createConnection({
		  host     : mysql_host,
		  user     : mysql_user,
		  password : mysql_password,
		  port     : mysql_port
		});

		connection.connect();

		await connection.query("CREATE DATABASE `" + mysql_database + "`");
		await connection.query("USE `" + mysql_database + "`");

		let mysqlFile = path.join(path.resolve('./service/init'), 'mysql-script.sql');
		let content = fs.readFileSync(mysqlFile, 'utf8');
		
		content = content.split(';');
	  for(let item of content) {
	    item = item.trim();
	    if(item) {
	      await connection.query(item);
	    }
	  }
	}catch(e) {
		console.log(e);
	}
};

exports.init = function(data){
  let {mysql_user, mysql_host, mysql_password, mysql_port, mysql_database, influx_host, influx_port} = data;
	updateConfig(data);
	initMySQL({mysql_user, mysql_host, mysql_password, mysql_port, mysql_database});

	return {
		errno: 0,
		message: 'success'
	}
}