# 迁移Migration

+ [CLI](#CLI)
  + [安装CLI](#安装CLI)
  + [引导](#引导)
    + [配置](#配置)
  + [创建第一个模型和迁移](#创建第一个模型和迁移)
  + [运行迁移](#运行迁移)
  + [回滚迁移](#回滚迁移)
  + [创建第一个Seed](#创建第一个Seed)
  + [运行Seeds](#运行Seeds)
  + [撤销Seeds](#撤销Seeds)
+ [进阶内容](#进阶内容)
  + [迁移骨架](#迁移骨架)
  + [\.sequelizerc文件](#\.sequelizerc文件)
  + [动态配置](#动态配置)
  + [使用Babel](#使用Babel)
  + [使用环境变量](#使用环境变量)
  + [明确方言选项](#明确方言选项)
  + [生产用法](#生产用法)
  + [存储](#存储)
    + [存储migration](#存储migration)
    + [存储Seed](#存储Seed)
  + [配置连接字符](#配置连接字符)
  + [传递具体的方言选项](#传递具体的方言选项)
  + [编程化用法](#编程化用法)
+ [查询接口](#查询接口)

----

就像你使用Git/SVN来管理你源代码的变化时，你可以使用迁移来跟踪数据的变化。使用迁移，你可以转移你存在的数据库到另一个版本或副本：那些版本的转化被保存在迁移文档中，描述了如何获取新的版本和如何回滚这些改变到老的版本。

你需要使用 [Sequelize CLI](https://github.com/sequelize/cli)。这个CLI工具（CLI ships）支持迁移和工程引导（project bootstrapping）

## CLI

### 安装CLI

让我们安装CLI开始，你可以在这[here](https://github.com/sequelize/cli)找到指导。最好以如下方式来安装到本地：

```js
$ npm install --save sequelize-cli
```

### 引导

你会需要执行`init`命令来创建一个空的工程。

`$ npx sequelize-cli init`

这会创建以下目录：

+ `config`包含参数文件，告诉CLI如何连接到数据库。
+ `models`包含你工程的所有模型
+ `migrations`包含所有migrations文件
+ `seeders`包含所有的seeds文件

#### 配置

为了之后的操作，首先，我们需要告诉CLI如何去连接数据库。为了完成它，让我们打开默认的配置文件`config/config.json`。他和下面的示例相似：

```js
{
  "development": {
    "username": "root",
    "password": null,
    "database": "database_development",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

现在来编辑这个文件并且设置正确的数据库认证和方言。对象的键值（例如“development”）在`model/index.js`上使用来匹配`process.env.NODE_ENV`（如果未定义，"developmnet"就是一个默认值）。

**注意**：如果你的数据库根本不存在，你可以调用db创建命令。正确操作情况下，它会为你创造数据库。

### 创建第一个模型和迁移

一旦你正确的配置完CLI配置文件后，你可以开始创建你的第一个迁移（Migration）。就仅仅像执行一个简单的命令一样。

我们会使用`model:generate`命令。这个命令会需要两个选项：

+ `name`：模型的名称
+ `attributes`：模型属性目录

我们创建一个`User`模型：

```js
$ npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string
```

这会完成以下操作：

+ 在`model`文件夹中创建一个模型文件`user`
+ 在`migrations`文件夹中创建一个migrations文件并以`XXXXXXXXXXXXXX-create-user.js`来命名

**注意**：Sequelize只使用模型文件，它是数据库表的体现。另一方面，被CLI所使用的migrations文件是模型的改变，更具体点，是数据库表的改变。就像数据库中事务的提交（commit）或日志（log）那样来处理迁移。

### 运行迁移

直到这步，我们还没有在数据库中插入任何值。我们只是为我们的一个模型`User`创建了需要的模型和迁移文件。现在，为了真实的在数据库中创建表，你需要运行`db:migrate`命令。

`$ npx sequelize-cli db:migrate`

这一命令将会执行以下三步：

+ 会在数据库中创建一个命名为`SequelizeMeta`的表。这个表会用来记录在当前的数据库中，哪次迁移已经运行。
+ 开始寻找还未运行的迁移文件。检查`SequelizeMeta`表来实现。此时，会运行`XXXXXXXXXXXXXX-create-user.js`迁移，这是我们创建的最后一步。
+ 创建一个命名为`Users`的表包含迁移文件中的所有具体的列。

### 回滚迁移

现在，我们的表格已经被创建并且被保存在数据库中。使用迁移，你可以只用执行一个命令就回滚到老的版本。

你可以使用`db:migrate:undo`，这一命令会回滚到最近的迁移。

```js
$ npx sequelize-cli db:migrate:undo
```

你可以使用`db:migrate:undo:all`来回滚到初始版本。通过传递它的名字到`--to`选项，你也可以回滚到一个具体的迁移版本。

### 创建第一个Seed

假设我们想要默认插入一些数据到少量的表格中。如果我们继续使用之前的例子，我们可以考虑为`User`表创建一个示例用户。

为了处理所有的迁移数据，你可以使用Seeder。Seed文件是数据的一些改变，它可以用来和示例数据或测试数据一同部署数据库表。

让我们创建一个Seed文件，它会添加一个示例用户到我们的`User`表中。

```js
$ npx sequelize-cli seed:generate --name demo-user
```

这一命令会在`seeders`文件夹中创造一个种子文件。文件名会以`XXXXXXXXXXXXXX-demo-user.js`模式命名。

与迁移文件一样，它同样支持`up/down`语法。

现在，我们应该编辑这个文件来插入示例用户到我们的`User`表中。

```js
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [{
        firstName: 'John',
        lastName: 'Doe',
        email: 'demo@demo.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
```

### 运行Seeds

在上一步，你已经创造了一个Seed文件。但还没有提交到数据库中。为了完成它，我们需要调用一下命令：

```js
$ npx sequelize-cli db:seed:all
```

这会执行Seed文件，并且你会讲示例用户插入进`User`表中。

**注意**：Seeders执行不像迁移一样使用`SequelizeMeta`表而存储在任何地方。如果你想重写这个，请参考存储章节。

### 撤销Seeds

如果Seeders使用了任何的存储，它们就可以被撤销。下列有两条可用的命令：

如果你想撤销最近的seed

```js
$ npx sequelize-cli db:seed:undo
```

如果你想撤销一个具体的seed

```js
$ npx sequelize-cli db:seed:undo --seed name-of-seed-as-in-data
```

如果你想撤销所有的seeds

```js
$ npx sequelize-cli db:seed:undo:all
```

## 进阶内容

### 迁移骨架

下列骨架展示了一个典型的迁移文件

```js
module.exports = {
  up: (queryInterface, Sequelize) => {
    // logic for transforming into the new state
  },

  down: (queryInterface, Sequelize) => {
    // logic for reverting the changes
  }
}
```

传递的`queryInterface`对象可以被用来更改数据库。`Sequelize`对象存储了可用的数据类型例如`STRING`或`INTERGER`。`up`或`down`函数应该返回一个`Promise`。例如：

```js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Person', {
        name: Sequelize.STRING,
        isBetaMember: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }
      });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Person');
  }
}
```

下列是一个迁移的示例，表现了数据库的两个改变，使用了事务来确保所有的指令都成功的被执行或者失败回滚：

```js
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn('Person', 'petName', {
                    type: Sequelize.STRING
                }, { transaction: t }),
                queryInterface.addColumn('Person', 'favoriteColor', {
                    type: Sequelize.STRING,
                }, { transaction: t })
            ])
        })
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.removeColumn('Person', 'petName', { transaction: t }),
                queryInterface.removeColumn('Person', 'favoriteColor', { transaction: t })
            ])
        })
    }
};
```

下列是一个有外键的迁移。你可以使用引用来明确一个外键：

```js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Person', {
      name: Sequelize.STRING,
      isBetaMember: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'users',
            schema: 'schema'
          }
          key: 'id'
        },
        allowNull: false
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Person');
  }
}
```

下列是一个迁移的例子，使用`async/await`来在一个新的列上创建一个独一无二的索引：

```js
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'Person',
        'petName',
        {
          type: Sequelize.STRING,
        },
        { transaction }
      );
      await queryInterface.addIndex(
        'Person',
        'petName',
        {
          fields: 'petName',
          unique: true,
        },
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(
        'Person',
        'petName',
        {
          type: Sequelize.STRING,
        },
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
```

### \.sequelizerc文件

这是一个特殊的配置文件。它会让你明确你经常使用的传递给CLI的多个选项。你可以在以下情况下使用。

+ 你想重写默认路径到`migrations`,`models`,`seeders`或`config`文件夹中。
+ 你想重命名`config.json`为类似于`database.json`

和更多情况。那么，应该如何使用这个文件来自定义配置呢？

首先，我们来在你工程的根目录下创建一个空的文件。

```js
$ touch .sequelizerc
```

现在，我们从一个示例参数开始：

```js
const path = require('path');

module.exports = {
  'config': path.resolve('config', 'database.json'),
  'models-path': path.resolve('db', 'models'),
  'seeders-path': path.resolve('db', 'seeders'),
  'migrations-path': path.resolve('db', 'migrations')
}
```

使用这个参数，你告诉CLI完成：

+ 使用`config/database.json`文件来配置设置
+ 使用`db/models`作为模型文件夹
+ 使用`db/seeders`作为seeders文件夹
+ 使用`db/migrations`作为迁移文件夹

### 动态配置

配置文件默认是一个名称为`config.json`的JSON文件。但是有时候，你想执行某些代码或获取环境变量时，它可能不是JSON文件。

Sequelize CLI可以同时读取`JSON`或`JS`文件。这可以通过设置`.sequelizerc`文件来启动。

首先你需要创建一个`.sequelizerc`文件在你工程的根目录下。这个文件应该重写配置路径到`JS`文件。例如：

```js
const path = require('path');

module.exports = {
  'config': path.resolve('config', 'config.js')
}
```

现在，Sequelize CLI会加载`config/config.js`来获取配置选项。既然这是一个JS文件，你可以有执行代码和导出最终的动态配置文件。

例如`config/config.js`文件

```js
const fs = require('fs');

module.exports = {
  development: {
    username: 'database_dev',
    password: 'database_dev',
    database: 'database_dev',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  test: {
    username: 'database_test',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        ca: fs.readFileSync(__dirname + '/mysql-ca-master.crt')
      }
    }
  }
};
```

### 使用Babel

现在你知道如何使用`.sequelizerc`文件了。接下来，我们来学习如何使用babel设置`sequelize-cli`。这会允许你使用ES6和ES7来编写迁移和seeders。

首先安装`babel-register`

```js
$ npm i --save-dev babel-register
```

现在，我们创建`.sequelizerc`文件，它包含你想为`sequelize-cli`所改变的所有配置，除此之外，我们想让它为我们的代码库注册babel。例如下列：

```js
$ touch .sequelizerc # Create rc file
```

现在在.sequelizerc中包含`babel-register`设置：

```js
require("babel-register");

const path = require('path');

module.exports = {
  'config': path.resolve('config', 'config.json'),
  'models-path': path.resolve('models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
}
```

现在，CLI可以在迁移或seeder中使用ES6/ES7的代码。需要注意的是，这个依赖取决于你的`.babelrc`配置。详情请参考[babeljs.io](https://babeljs.io/)

### 使用环境变量

使用CLI，你可以直接在`config/config.js`中获取环境变量。你可以使用`.sequelizerc`来告诉CLI去使用`config/config.js`来配置文件。这在上一章节已经被阐述了

然后你可以使用恰当的环境变量来暴露文件。

```js
module.exports = {
  development: {
    username: 'database_dev',
    password: 'database_dev',
    database: 'database_dev',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  test: {
    username: process.env.CI_DB_USERNAME,
    password: process.env.CI_DB_PASSWORD,
    database: process.env.CI_DB_NAME,
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOSTNAME,
    dialect: 'mysql'
  }
};
```

### 明确方言选项

有时候你想明确一个方言选项，如果它是通用配置，你只需要把它加到`config/config.json`中。有时候，你想执行某些代码去获取方言选项，你应该使用动态配置文件。

```js
{
    "production": {
        "dialect":"mysql",
        "dialectOptions": {
            "bigNumberStrings": true
        }
    }
}
```

### 生产用法

一些关于在生产环境下使用CLI和迁移设置的提示：

1）为配置设置使用环境变量。这在动态配置中最好实现。一个安全的生产配置应该如下所示：

```js
const fs = require('fs');

module.exports = {
  development: {
    username: 'database_dev',
    password: 'database_dev',
    database: 'database_dev',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  test: {
    username: 'database_test',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        ca: fs.readFileSync(__dirname + '/mysql-ca-master.crt')
      }
    }
  }
};
```

我们的目标是为多种数据库秘钥使用环境变量，而不是偶然的从源头上检查他们。

### 存储

你可以使用下列三种方法来存储：`sequelize`，`json`和`none`。

+ `sequelize`：存储migrations和seeds到一个sequelize数据库的表格中
+ `json`：存储migrations和seeds到一个json文件中
+ `none`：不存储任何migrations和seed

#### 存储migration

默认情况下，CLI会在你的数据库中创建一个名为`SequelizeMeta`的表，来包含一个为每次执行迁移的入口。为了改变这个行为，你可以在配置文件中添加三个选项。使用`migrationStorage`，你可以选择迁移的存储类型。如果你选择了`json`，你可以使用`migrationStoragePath`来明确文件路径，或者CLI会在`sequelize-meta.json`文件中写入。如果你想保存数据库的数据，使用`sequelize`，但是使用另外一个表，你可以使用`migrationStorageTableName`来改变表格名称。你也可以通过提供`migrationStroageTableSchema`属性为`SequelizeMeta`定义一个不同的schema。

```js
{
  "development": {
    "username": "root",
    "password": null,
    "database": "database_development",
    "host": "127.0.0.1",
    "dialect": "mysql",

    // Use a different storage type. Default: sequelize
    "migrationStorage": "json",

    // Use a different file name. Default: sequelize-meta.json
    "migrationStoragePath": "sequelizeMeta.json",

    // Use a different table name. Default: SequelizeMeta
    "migrationStorageTableName": "sequelize_meta",

    // Use a different schema for the SequelizeMeta table
    "migrationStorageTableSchema": "custom_schema"
  }
}
```

**注意**：不推荐使用空存储来存储migration。如果你坚持使用的话，注意可能会产生迁移后没有记录或根本无法执行。

#### 存储Seed

默认情况下CLI不会存储任何执行过的Seed文件。如果你想要改变这一行为，你可以在配置文件中使用`seederStorage`来改变存储类型。如果你选择`json`，你可以使用`seederStoragePath`来明确路径，否则的话，CLI会写入到`sequelize-data.json`文件中。如果你想保持数据库的信息，使用`sequelize`，你可以使用`seederStorageTableName`来明确表格名称，否则，它会默认为`SequelizeData`。

```js
{
  "development": {
    "username": "root",
    "password": null,
    "database": "database_development",
    "host": "127.0.0.1",
    "dialect": "mysql",
    // Use a different storage. Default: none
    "seederStorage": "json",
    // Use a different file name. Default: sequelize-data.json
    "seederStoragePath": "sequelizeData.json",
    // Use a different table name. Default: SequelizeData
    "seederStorageTableName": "sequelize_data"
  }
}
```

### 配置连接字符

你可以使用`--url`选项来传递一个连接字符，这是和配置文件的`--config`选项来定义你数据库的另外一种方法。例如：

```js
$ npx sequelize-cli db:migrate --url 'mysql://root:password@mysql_host.com/database_name'
```

### 传递具体的方言选项

```js
{
    "production": {
        "dialect":"postgres",
        "dialectOptions": {
            // dialect options like SSL etc here
        }
    }
}
```

### 编程化用法

Sequelize有一个字库 [sister library](https://github.com/sequelize/umzug)。用来编程化处理迁移任务的执行和记录。

## 查询接口

在你改变数据库Schema之前，使用`queryInterface`对象描述。详情请查询它所支持的全部公共方法[QueryInterface API](https://sequelize.org/master/class/lib/query-interface.js~QueryInterface.html)。