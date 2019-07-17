import {sequelize,Sequelize} from "./dataBaseConfig"
const Foo = Sequelize.Model
//初始化
Foo.init({
  name:Sequelize.STRING,
  age:Sequelize.INTEGER
},{
  sequelize,
  modelName:'client'
})
//测试数据
let CreatedDemo:Object = [
    {name:"jerry",age:12},
    {name:"kiko",age:14},
    {name:"john",age:15},
    {name:"lolita",age:16},
]
//async函数创建并打印
async function myname(Foo:any){
    await Foo.bulkCreate(CreatedDemo)
    await Foo.findAll().then((users:any)=>{
        users.forEach((user:any) => {
        console.log(user.name)
        })
    })
}
//测试成功添加
myname(Foo).then(()=>{console.log('ok')})