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
//配置连接信息
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
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
//定义model表：
const User = sequelize.define('user', {
    // 属性
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING
      // 允许默认值
    }
  }, {
    timestamps: false //默认为true 此时表中应有createAt 和 updateAt两项，否则请修改为false
});
//查询
//1查询所有数据
User.findAll().then(users => {
    console.log("All users:", JSON.stringify(users, null, 4));
});
//2.创建新用户
User.create({ firstName: "Jane", lastName: "Doe" }).then(jane => {
    console.log("Jane's auto-generated ID:", jane.id);
});
//3.删除名为：“Jane”的用户
User.destroy({
    where: {
      firstName: "Jane"
    }
  }).then(() => {
    console.log("Deleted");
  });
//4.更改所有lastName为空的名字到：“Doe”
User.update({ lastName: "steven" }, {
    where: {
      lastName: "chen"
    }
  }).then(() => {
    console.log("Updated");
  });