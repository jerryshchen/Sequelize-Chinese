# TypeScript

+ [安装](#安装)
+ [用法](#用法)
+ [sequelize.define的用法](#sequelize.define的用法)

----

从v5开始，Sequelize提供了关于TypeScript的定义。请注意只支持TS3.1以上版本。

因为Sequelize深度依赖运行性能分配，TypeScript不能**“开箱即用”**。需要配置一系列人工的定义来使得模型可用。

## 安装

为了避免非TS用户的过度安装，需要手动安装以下归类包：

- `@types/node` (this is universally required)
- `@types/validator`
- `@types/bluebird`

## 用法

一个最简的TpyeScript工程：

```js
import { Sequelize, Model, DataTypes, BuildOptions } from 'sequelize';
import { HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManyHasAssociationMixin, Association, HasManyCountAssociationsMixin, HasManyCreateAssociationMixin } from 'sequelize';

class User extends Model {
  public id!: number; // Note that the `null assertion` `!` is required in strict mode.
  public name!: string;
  public preferredName!: string | null; // for nullable fields

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Since TS cannot determine model association at compile time
  // we have to declare them here purely virtually
  // these will not exist until `Model.init` was called.

  public getProjects!: HasManyGetAssociationsMixin<Project>; // Note the null assertions!
  public addProject!: HasManyAddAssociationMixin<Project, number>;
  public hasProject!: HasManyHasAssociationMixin<Project, number>;
  public countProjects!: HasManyCountAssociationsMixin;
  public createProject!: HasManyCreateAssociationMixin<Project>;

  // You can also pre-declare possible inclusions, these will only be populated if you
  // actively include a relation.
  public readonly projects?: Project[]; // Note this is optional since it's only populated when explicitly requested in code

  public static associations: {
    projects: Association<User, Project>;
  };
}

const sequelize = new Sequelize('mysql://root:asd123@localhost:3306/mydb');

class Project extends Model {
  public id!: number;
  public ownerId!: number;
  public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

class Address extends Model {
  public userId!: number;
  public address!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED, // you can omit the `new` but this is discouraged
    autoIncrement: true,
    primaryKey: true,
  },
  ownerId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  name: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  }
}, {
  sequelize,
  tableName: 'projects',
});

User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  },
  preferredName: {
    type: new DataTypes.STRING(128),
    allowNull: true
  }
}, {
  tableName: 'users',
  sequelize: sequelize, // this bit is important
});

Address.init({
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
  address: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  }
}, {
  tableName: 'address',
  sequelize: sequelize, // this bit is important
});

// Here we associate which actually populates out pre-declared `association` static and other methods.
User.hasMany(Project, {
  sourceKey: 'id',
  foreignKey: 'ownerId',
  as: 'projects' // this determines the name in `associations`!
});

Address.belongsTo(User, {targetKey: 'id'});
User.hasOne(Address,{sourceKey: 'id'});

async function stuff() {
  // Please note that when using async/await you lose the `bluebird` promise context
  // and you fall back to native
  const newUser = await User.create({
    name: 'Johnny',
    preferredName: 'John',
  });
  console.log(newUser.id, newUser.name, newUser.preferredName);

  const project = await newUser.createProject({
    name: 'first!',
  });

  const ourUser = await User.findByPk(1, {
    include: [User.associations.projects],
    rejectOnEmpty: true, // Specifying true here removes `null` from the return type!
  });
  console.log(ourUser.projects![0].name); // Note the `!` null assertion since TS can't know if we included
                                          // the model or not
}
```

## sequelize.define的用法

当我们使用`sequelize.define`方法时，TypeScript不知道如何生成一个`class`定义。因此，我们需要一些手动的工作并申明一个接口和类型，并最终投射`.define`的结果到那个*静态*类型。

```js
// We need to declare an interface for our model that is basically what our class would be
interface MyModel extends Model {
  readonly id: number;
}

// Need to declare the static model so `findOne` etc. use correct types.
type MyModelStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): MyModel;
}

// TS can't derive a proper class definition from a `.define` call, therefor we need to cast here.
const MyDefineModel = <MyModelStatic>sequelize.define('MyDefineModel', {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
  }
});

function stuffTwo() {
  MyDefineModel.findByPk(1, {
    rejectOnEmpty: true,
  })
  .then(myModel => {
    console.log(myModel.id);
  });
}
```

