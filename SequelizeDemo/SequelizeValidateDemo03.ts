import {sequelize,Sequelize} from "./dataBaseConfig"
const Foo = Sequelize.Model
  //初始化Foo, 定义检验方法，不允许为空,不允许为null
  Foo.init({
    firstName: {
      type:Sequelize.STRING,
      allowNull:false,
      validate:{
        notNull:{
          msg:"please enter your firstName"
        }
      }
    },
    lastName: {
      type:Sequelize.STRING,
      allowNull:false,
      validate:{
        notNull:{
          msg:"please enter your lastName"
        }
      }
    }
  }, {
    sequelize,
    modelName: 'users',
    timestamps:false
  });
  
Foo
    .create({firstName:'mhq'})
    //默认报错users.lastName cannot be null
    //设置后报错：please enter your lastName
    // .create({firstName:'mhq',lastName:'chen'})
    .then((employee:any) => {
    console.log(employee.firstName);
    console.log(employee.lastName);
  })