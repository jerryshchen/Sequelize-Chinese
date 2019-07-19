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
//建立非持久化实例化对象
// const user = Foo.build({name:"Kobe",age:18})  
// user.save().then(()=>{
//   console.log(user.name)
//   sequelize.close()
// })
//链式连接
// Foo
//   .build({name:"Poul",age:20})
//   .save()
//   .then((user:any)=>{
//     console.log(user.name)
//     sequelize.close()
//   })
//建立持久化实例
// Foo.create({name:"James",age:32})
//   .then((user:any)=>{
//     console.log(user.name)
//     sequelize.close()
//   })
//使用get方法来获取对象
// Foo.create({name:"Curry",age:34})
//   .then((user:any)=>{
//     console.log(user.get({plain:true}))
//     sequelize.close()
//   })
//更新/存储/永久化实例
// const user = Foo.build({name:'Stevf',age:20})
// // user.name = "Steff"
// //or
// user.update({
//   name:'Steff',
//   age:20
// }).then(()=>{})
//更改数据库的值，fields字段里值来确定哪些值需要被改变
//  user.update({name:'Sven',age:20},{fields:['name','age']}).then(()=>{sequelize.close()})
//重载实例
// Foo.findOne({ where: { name: 'mhq' } }).then((person:any) => {
//   person.name = 'jane'
//   console.log(person.name) // 'jane'

//   person.reload().then(() => {
//     console.log(person.name) // 'mhq'
//   }).finally(()=>{sequelize.close()})
// })
