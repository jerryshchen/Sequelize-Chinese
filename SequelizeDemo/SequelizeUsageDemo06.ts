import {sequelize,Sequelize} from "./dataBaseConfig"
const Foo = Sequelize.Model
//初始化
const Op = Sequelize.Op
Foo.init({
  name:Sequelize.STRING,
  age:Sequelize.INTEGER
},{
  sequelize,
  modelName:'client'
})
//findAndCountAll函数
Foo.findAndCountAll({
  where:{
    age:{
      [Op.gt]:14   //获取年龄大于14的列
    }
  },
  offset:1, //从第二个开始
  limit:4 //限制数量为4
}).then((users:any)=>{
   console.log(users.count); //打印user数据
   for(let i in users.rows){
     console.log(users.rows[i].name)
   }
})
//使用 order and group 查询
Foo.findAll({
  where: {
    age: {
      [Op.gt]:14
    }
  },
  order:[['name','DESC']]
}).then((users:any)=>{
  for(let i in users){
    console.log(users[i].name)
  }
}).then(()=>{return sequelize.close()});
//max
Foo.max('age').then((usermaxAge:number)=>{console.log(usermaxAge)})
    .then(()=>{return sequelize.close()});
//min
Foo.min('age').then((userminAge:number)=>{console.log(userminAge)})
    .then(()=>{return sequelize.close()});
//sum
Foo.sum('age').then((userSumAge:number)=>{console.log(userSumAge)})
    .then(()=>{return sequelize.close()});