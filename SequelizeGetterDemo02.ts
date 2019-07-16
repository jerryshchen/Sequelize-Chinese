import {sequelize,Sequelize} from "./dataBaseConfig"
const Model = Sequelize.Model
//定义Foo的get和set方法
class Foo extends Model {

    get fullName():string {
        return this.firstName + ' ' + this.lastName;
      }
    
    set fullName(value) {
        const names = value.split(' ');
        this.setDataValue('firstName', names.slice(0, -1).join(' '));
        this.setDataValue('lastName', names.slice(-1).join(' '));
    }
  }
  //初始化Foo
  Foo.init({
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING
  }, {
    sequelize,
    modelName: 'users',
    timestamps:false
  });
  
Foo
    .findOne({where:{lastName:"Doe"}})
    .then((employee:any) => {
    console.log(employee.fullName);
    console.log(employee);
    // console.log(employee.get('firstName')); // John Doe (SENIOR ENGINEER)
    // console.log(employee.get('lastName')); // SENIOR ENGINEER
  })