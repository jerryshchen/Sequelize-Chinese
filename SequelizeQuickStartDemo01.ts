import {sequelize,Sequelize,Model} from "./dataBaseConfig"
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
User.findAll().then((users:Model) => {
    console.log("All users:", JSON.stringify(users, null, 4));
});
