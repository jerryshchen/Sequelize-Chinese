import {sequelize,Sequelize} from "./dataBaseConfig"
const Foo = Sequelize.Model
//数据库同步demo
Foo.init({
  name:Sequelize.STRING,
  age:Sequelize.INTEGER
},{
  sequelize,
  modelName:'client'
})
//强制同步
//不存在就创建，存在就删除
Foo.sync({ force: true }).then(() => {
  // Now the `client` table in the database corresponds to the model definition
  return Foo.create({
    name: 'mhq',
    age: 14
  });
}).then((user:any)=>{
  console.log(user.name)
  console.log(user.age)
});