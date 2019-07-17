//数据库配置
//配置连接信息
export {Sequelize,sequelize,Model}
const Sequelize = require('sequelize');
interface Model {
    database:string;
    username:string;
    password:string;
    connUrl:{
        host:string,
        dialect: string
    }
}
let myConn : Model = {
    database:'2019/3/31',
    username:'root',
    password:'root',
    connUrl:{
        host:"127.0.0.1",
        dialect:'mysql'
    }
}
//建立连接
const sequelize = new Sequelize(myConn.database,myConn.username,myConn.password,{
    host:myConn.connUrl.host,
    dialect:myConn.connUrl.dialect
})
//检验连接
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((err: any) => {
        console.error('Unable to connect to the database:', err);
    });