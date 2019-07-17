# Hooks

- [操作顺序](#操作顺序)
- [声明钩子函数](#声明钩子函数)
- [移除钩子](#移除钩子)
- [全局钩子](#全局钩子)
  - [默认钩子](#默认钩子)
  - [永久钩子](#永久钩子)
  - [连接钩子](#连接钩子)
- [实例钩子](#实例钩子)
  - [模型钩子](#模型钩子)
- [关联](#关联)
  - [关于事务的提示](#关于事务的提示)
  - [内部事务](#内部事务)



Hooks(也被称为生命周期事件)，是在sequelize执行前或执行后的函数。 例如，如果你总是想在储存之前设置一个值到模型上，你可以添加一个`beforeUpdate`钩子。

请查看 [Hooks file](https://github.com/sequelize/sequelize/blob/master/lib/hooks.js#L7)，来获取完整的列表。

## 操作顺序

```js
(1)
  beforeBulkCreate(instances, options)
  beforeBulkDestroy(options)
  beforeBulkUpdate(options)
(2)
  beforeValidate(instance, options)
(-)
  validate
(3)
  afterValidate(instance, options)
  - or -
  validationFailed(instance, options, error)
(4)
  beforeCreate(instance, options)
  beforeDestroy(instance, options)
  beforeUpdate(instance, options)
  beforeSave(instance, options)
  beforeUpsert(values, options)
(-)
  create
  destroy
  update
(5)
  afterCreate(instance, options)
  afterDestroy(instance, options)
  afterUpdate(instance, options)
  afterSave(instance, options)
  afterUpsert(created, options)
(6)
  afterBulkCreate(instances, options)
  afterBulkDestroy(options)
  afterBulkUpdate(options)
```

## 声明钩子函数

钩子函数的参数通过引用来传递。 这意味着，你可以改变这些参数，并且可以反映在插入或者更新语句中。一个钩子可能会包含async函数， 所以在这种情况下，钩子函数应该返回一个Promise。

下列是三种添加钩子函数的方法：

+ `.init`方法

```js
class User extends Model {}
User.init({
  username: DataTypes.STRING,
  mood: {
    type: DataTypes.ENUM,
    values: ['happy', 'sad', 'neutral']
  }
}, {
  hooks: {
    beforeValidate: (user, options) => {
      user.mood = 'happy';
    },
    afterValidate: (user, options) => {
      user.username = 'Toni';
    }
  },
  sequelize
});
```

+ `.addHook()`方法

```js
User.addHook('beforeValidate', (user, options) => {
  user.mood = 'happy';
});

User.addHook('afterValidate', 'someCustomName', (user, options) => {
  return Promise.reject(new Error("I'm afraid I can't let you do that!"));
});
```

+ 直接添加

```js
User.addHook('beforeValidate', (user, options) => {
  user.mood = 'happy';
});

User.addHook('afterValidate', 'someCustomName', (user, options) => {
  return Promise.reject(new Error("I'm afraid I can't let you do that!"));
});
```

## 移除钩子

只有有姓名参数的钩子可以被移除

```js
class Book extends Model {}
Book.init({
  title: DataTypes.STRING
}, { sequelize });

Book.addHook('afterCreate', 'notifyUsers', (book, options) => {
  // ...
});

Book.removeHook('afterCreate', 'notifyUsers');
```

同一个名字下可以有多个钩子。调用`.removeHook()`函数将会移除所有钩子。

## 全局钩子

全局钩子是在所有模型中运行的钩子。 他们可以定义你想让你模型都拥有的行为， 这对插件来说十分有用。 它们可以通过下列两种方式定义，它们在语义上有轻微的不同：

### 默认钩子

默认钩子(Sequelize.options.define)

```js
const sequelize = new Sequelize(..., {
    define: {
        hooks: {
            beforeCreate: () => {
              // Do stuff
            }
        }
    }
});
```

这会给所有的模型添加一个默认的钩子， 如果之后的模型没有定义自己的`beforeCreate`钩子函数的话，这个钩子函数将会执行：

```js
class User extends Model {}
User.init({}, { sequelize });
class Project extends Model {}
Project.init({}, {
    hooks: {
        beforeCreate: () => {
            // Do other stuff
        }
    },
    sequelize
});

User.create() // Runs the global hook
Project.create() // Runs its own hook (because the global hook is overwritten)
```

### 永久钩子

永久钩子(Sequelize.addHook)

```js
sequelize.addHook('beforeCreate', () => {
    // Do stuff
});
```

不管具体的模型是否定义了`beforeCreate`钩子，这个钩子都会在模型创建前运行。本地钩子永远都会在全局钩子之前运行：

```js
class User extends Model {}
User.init({}, { sequelize });
class Project extends Model {}
Project.init({}, {
    hooks: {
        beforeCreate: () => {
            // Do other stuff
        }
    },
    sequelize
});

User.create() // Runs the global hook
Project.create() // Runs its own hook, followed by the global hook
```

永久钩子也可以在`Sequelize.options`定义：

```js
new Sequelize(..., {
    hooks: {
        beforeCreate: () => {
            // do stuff
        }
    }
});
```

### 连接钩子

Sequelize提供了四个在数据库连接之前或连接断开时立即执行的钩子：

```js
beforeConnect(config)
afterConnect(connection, config)
beforeDisconnect(connection)
afterDisconnect(connection)
```

当你需要在数据库创建时去异步的获取证书时或者需要直接获取低等级的数据库连接时，这些钩子就会非常有用。

例如，我们可以从一个随时更新的token商店中异步的获取数据库密码，并且用这些新的证书来改变Sequelize的配置对象：

```js
sequelize.beforeConnect((config) => {
    return getAuthToken()
        .then((token) => {
             config.password = token;
         });
    });
```

当链接池被所有钩子所共享时，这些钩子可能只会作为一个永久的钩子来声明。

## 实例钩子

不论何时你编辑单一对象时，下列钩子都会被触发

```js
beforeValidate
afterValidate or validationFailed
beforeCreate / beforeUpdate / beforeSave  / beforeDestroy
afterCreate / afterUpdate / afterSave / afterDestroy
```

```js
// ...define ...
User.beforeCreate(user => {
  if (user.accessLevel > 10 && user.username !== "Boss") {
    throw new Error("You can't grant this user an access level above 10!")
  }
})
```

下列例子将会返回一个错误：

```js
User.create({username: 'Not a Boss', accessLevel: 20}).catch(err => {
  console.log(err); // You can't grant this user an access level above 10!
});
```

下列例子将会成功返回：

```js
User.create({username: 'Boss', accessLevel: 20}).then(user => {
  console.log(user); // user object with username as Boss and accessLevel of 20
});
```

### 模型钩子

有时候你可能需要在使用`bulkCreate`,`update`,`destroy`方法中同时编辑不止一条记录。下列函数将会触发当你使用上述方法时:

```js
beforeBulkCreate(instances, options)
beforeBulkUpdate(options)
beforeBulkDestroy(options)
afterBulkCreate(instances, options)
afterBulkUpdate(options)
afterBulkDestroy(options)
```

如果你想每次记录都触发钩子函数时，你可以同许多钩子一起，在调用方法时传递`individualHooks:true`

**Warning**：如果你使用独立钩子，在你钩子调用前，所有需要更新或者销毁的实例都会加载进内存中。Sequelize可以处理的实例数目和独立钩子数被可用内存所限定.

```js
Model.destroy({ where: {accessLevel: 0}, individualHooks: true});
// Will select all records that are about to be deleted and emit before- + after- Destroy on each instance

Model.update({username: 'Toni'}, { where: {accessLevel: 0}, individualHooks: true});
// Will select all records that are about to be updated and emit before- + after- Update on each instance
```

hook方法的`options`参数是提供给相对应的方法或者是克隆和扩展版本的第二个参数。

```js
Model.beforeBulkCreate((records, {fields}) => {
  // records = the first argument sent to .bulkCreate
  // fields = one of the second argument fields sent to .bulkCreate
})

Model.bulkCreate([
    {username: 'Toni'}, // part of records argument
    {username: 'Tobi'} // part of records argument
  ], {fields: ['username']} // options parameter
)

Model.beforeBulkUpdate(({attributes, where}) => {
  // where - in one of the fields of the clone of second argument sent to .update
  // attributes - is one of the fields that the clone of second argument of .update would be extended with
})

Model.update({gender: 'Male'} /*attributes argument*/, { where: {username: 'Tom'}} /*where argument*/)

Model.beforeBulkDestroy(({where, individualHooks}) => {
  // individualHooks - default of overridden value of extended clone of second argument sent to Model.destroy
  // where - in one of the fields of the clone of second argument sent to Model.destroy
})

Model.destroy({ where: {username: 'Tom'}} /*where argument*/)
```

如果你使用`Model,bulkCreate(...)`和`updateOnDuplicate`选项，钩子函数中改变的领域，但这些领域没有被给到的`updateOnDuplicate`数组，也不会写到数据库中。 当然，如果你想的话， 你也可以改变钩子中的`updateOnDuplicate`选项

```js
// Bulk updating existing users with updateOnDuplicate option
Users.bulkCreate([
  { id: 1, isMember: true },
  { id: 2, isMember: false }
], {
  updateOnDuplicate: ['isMember']
});

User.beforeBulkCreate((users, options) => {
  for (const user of users) {
    if (user.isMember) {
      user.memberSince = new Date();
    }
  }

  // Add memberSince to updateOnDuplicate otherwise the memberSince date wont be
  // saved to the database
  options.updateOnDuplicate.push('memberSince');
});
```

## 关联

当钩子函数与实例关联时，钩子函数的大部分都会同样作用于实例。

除了下列事件：

1. 当使用`add`或者`set`方法时，`beforeUpdate`或`afterUpdate`钩子将会运行

	2. 只有一种方式可以在关联时调用`beforeDestroy`或`afterDestroy`钩子就是设置`onDeleter:'cascade'`和		选项`hooks:true`时。例如：

```js
class Projects extends Model {}
Projects.init({
  title: DataTypes.STRING
}, { sequelize });

class Tasks extends Model {}
Tasks.init({
  title: DataTypes.STRING
}, { sequelize });

Projects.hasMany(Tasks, { onDelete: 'cascade', hooks: true });
Tasks.belongsTo(Projects);
```

这段代码将会在任务表中执行`beforeDestroy`/`afterDestroy`。Sequelize默认会尽可能的优化你的。当调用级联删除时， Sequelize只会执行：

```js
DELETE FROM `table` WHERE associatedIdentifier = associatedIdentifier.primaryKey
```

然而，添加`hooks:true`后，意味着告诉Sequelize最佳优化并不重要， 因此就会为了用正确的参数调用钩子函数，而执行`SELECT`在相关联的对象上并且一条一条的删除实例

如果你的关联时多读多的话（`n:m`），当调用`remove`方法时，你会对能会对在整个模型上卸下钩子而感兴趣。 内部的，Sequelize会在整个实例上使用`Model.destroy`来调用`bulkDestroy`而不是`before/afterDestroy`钩子。

这可以通过传递`{individualHooks:true}`来解决`remove`调用， 导致了每一个钩子都可以在每个实例对象被移除时调用。

## 关于事务的提示

需要注意的是，Sequelize中许多模型的操作都会在选项参数中允许你明确一个具体的事务。 如果一个事务在最初的调用中被明确，它会表现在options参数中并被传递到钩子函数中。例如，考虑以下片段：

```js
// Here we use the promise-style of async hooks rather than
// the callback.
User.addHook('afterCreate', (user, options) => {
  // 'transaction' will be available in options.transaction

  // This operation will be part of the same transaction as the
  // original User.create call.
  return User.update({
    mood: 'sad'
  }, {
    where: {
      id: user.id
    },
    transaction: options.transaction
  });
});


sequelize.transaction(transaction => {
  User.create({
    username: 'someguy',
    mood: 'happy',
    transaction
  });
});
```

如果我们没有在以前的代码中调用`User.update`中时包含事务选项，什么改变都不会发生，因为我们新创立的用户并不在数据库中存在直到挂起的事务被处理。

### 内部事务

意识到Sequelize可能会内部使用事务当执行例如`Model.findOrCreate`操作时。如果你的钩子函数依赖数据库中某个对象时， 当它执行读或写的操作时，或者更改数据库的存取值时就像上述代码的示例时，你应该始终明确`{transaction:options.transaction}`。

如果在事务操作中，钩子函数已经被调用，那么请确保你独立的读或写操作是同一事务的一部分。如果钩子函数没有交易，你只需要明确`{transaction:null}`并且可以得到预期的默认行为。



