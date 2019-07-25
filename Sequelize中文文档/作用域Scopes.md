# 作用域Scopes

作用域允许你定义一个常用的查询，所以你之后可以轻松的使用。作用域包括了所有的作为查询器的属性。`where`，`include`，`limit`等。

## 定义

作用域在模型初始化时定义，它也可以是查询器对象，或者返回查询器对象。除了默认的作用域，它只能是一个对象：

```js
class Project extends Model {}
Project.init({
  // Attributes
}, {
  defaultScope: {
    where: {
      active: true
    }
  },
  scopes: {
    deleted: {
      where: {
        deleted: true
      }
    },
    activeUsers: {
      include: [
        { model: User, where: { active: true }}
      ]
    },
    random () {
      return {
        where: {
          someNumber: Math.random()
        }
      }
    },
    accessLevel (value) {
      return {
        where: {
          accessLevel: {
            [Op.gte]: value
          }
        }
      }
    }
    sequelize,
    modelName: 'project'
  }
});
```

你也可以在模型定义之后添加作用域，调用`addScope`。这尤其在带有`includes`的作用域中十分有用，因为include中的模型可能在那时还未定义而其他模型已经定义了。

默认的作用域将会一直被应用。这意味着，如果上述模型已经定义了，`Project.findAll()`会创建以下查询：

`SELECT * FROM projects WHERE active = true`

默认的作用域可以通过调用`.unscoped()`，`.scope(null)`来被移除或者被另外一个作用域所触发：

```js
Project.scope('deleted').findAll(); // Removes the default scope
```

`SELECT * FROM projects WHERE deleted = true`

你也可以在作用域定义时包含作用域模型。这允许你避免重复的`include`，`attributes`或者`where`定义。使用上述实例，并且在包含的`User`模型上触发`active`定义域（而不是在包含的对象中直接定义条件）：

```js
activeUsers: {
  include: [
    { model: User.scope('active')}
  ]
}
```

## 用法

作用域可以通过调用`.scope`来应用在模型定义中，来传递一个或多个作用域名称。`.scope`返回一个完全的函数模型实例包含所有的常见模型：`.findAll`，`.update`，`.count`，`.destroy`等等。你也可以保存这个模型实例并且之后使用：

```js
const DeletedProjects = Project.scope('deleted');

DeletedProjects.findAll();
// some time passes

// let's look for deleted projects again!
```

作用域适用于`.find`, `.findAll`, `.count`, `.update`, `.increment` and `.destroy`。

作用域函数可以用下列两种方式触发。如果作用域函数没有携带任何参数，它会正常触发。如果作用域携带任何参数，传递一个对象：

```js
Project.scope('random', { method: ['accessLevel', 19]}).findAll();
```

会产生以下SQL语句：

```js
SELECT * FROM projects WHERE someNumber = 42 AND accessLevel >= 19
```

## 合并

几个作用域可以通过传递一个作用域数组到`.scope`来自发的应用，或者通过传递作用域作为连续性的参数。

```js
// These two are equivalent
Project.scope('deleted', 'activeUsers').findAll();
Project.scope(['deleted', 'activeUsers']).findAll();
```

```SQL
SELECT * FROM projects
INNER JOIN users ON projects.userId = users.id
WHERE projects.deleted = true
AND users.active = true
```

如果你想使用另一个作用域和默认的作用域，传递键值`defaultScope`到`.scope`：

```js
Project.scope('defaultScope', 'deleted').findAll();
```

```sql
SELECT * FROM projects WHERE active = true AND deleted = true
```

当触发几个作用域时，随后作用域的键会重写掉之前的那些（类似于[Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)）,除了`where`和`include`，他们将会被合并。考虑下列作用域：

```js
{
  scope1: {
    where: {
      firstName: 'bob',
      age: {
        [Op.gt]: 20
      }
    },
    limit: 2
  },
  scope2: {
    where: {
      age: {
        [Op.gt]: 30
      }
    },
    limit: 10
  }
}
```

调用`.scope('scope1','scope2')`会产生下列请求：

```sql
WHERE firstName = 'bob' AND age > 30 LIMIT 10
```

注意当`firstName`保存后，`limit`和`age`被`scope2`如何被重写的。`limit`, `offset`, `order`, `paranoid`, `lock` and `raw`字段被重写而`where`被浅复制（意味着相同的键值将会被重写）。`include`的合并策略将会在之后被讨论。

**注意**：多个应用的作用域将会以`attributes.exclude`被保存的方法来融合`attributes`属性值。这允许了合并多个作用域并且也不会在最终的作用域中泄露任何敏感字段。

当在一个作用域模型上直接传递一个查询对象到`findAll`对象时，同样的合并逻辑也会被应用：

```js
Project.scope('deleted').findAll({
  where: {
    firstName: 'john'
  }
})
```

这里，`delete`作用域合并到了查询器中。如果我们传递`where: { firstName: 'john', deleted: false }`到查询器中，`deleted`作用域会被重写。

### 合并包含

基于创建的模型，`Includes`会递归的合并。这是在v5上添加的一个非常强大的合并，通过下列例子会很好的理解。

考虑以下四个模型：Foo,Bar,Baz和Qux， 他们有下列联系： 

```js
class Foo extends Model {}
class Bar extends Model {}
class Baz extends Model {}
class Qux extends Model {}
Foo.init({ name: Sequelize.STRING }, { sequelize });
Bar.init({ name: Sequelize.STRING }, { sequelize });
Baz.init({ name: Sequelize.STRING }, { sequelize });
Qux.init({ name: Sequelize.STRING }, { sequelize });
Foo.hasMany(Bar, { foreignKey: 'fooId' });
Bar.hasMany(Baz, { foreignKey: 'barId' });
Baz.hasMany(Qux, { foreignKey: 'bazId' });
```

现在，考虑定义在Foo的以下四个定义域：

```js
{
  includeEverything: {
    include: {
      model: this.Bar,
      include: [{
        model: this.Baz,
        include: this.Qux
      }]
    }
  },
  limitedBars: {
    include: [{
      model: this.Bar,
      limit: 2
    }]
  },
  limitedBazs: {
    include: [{
      model: this.Bar,
      include: [{
        model: this.Baz,
        limit: 2
      }]
    }]
  },
  excludeBazName: {
    include: [{
      model: this.Bar,
      include: [{
        model: this.Baz,
        attributes: {
          exclude: ['name']
        }
      }]
    }]
  }
}
```

这四个定义域可以轻松地被深入融合。例如，调用`Foo.scope('includeEverything', 'limitedBars', 'limitedBazs', 'excludeBazName').findAll()`，这会等价调用下列方法：

```js
Foo.findAll({
  include: {
    model: this.Bar,
    limit: 2,
    include: [{
      model: this.Baz,
      limit: 2,
      attributes: {
        exclude: ['name']
      },
      include: this.Qux
    }]
  }
});
```

观察上述四个定义域是如何被合并到一起的。基于包含的模型来合并的定义域内容。如果一个定义域包含模型A，另一个包含模型B，合并结果将会包含模型A和B。另一方面，如果包含的同样的模型A，但是不同的选项（例如内嵌内容或者其他属性），这将会递归的合并，正如同以上展示的那样。

不管顺序如何，上述描述的合并同样适用。顺序只在一个特定的选项被两个不同的作用域设置时才会起作用。然而，上述例子不是这一情况，因为每个作用域完成了不同的事情。

这一合并策略同样适用于传递到`.findAll`，`findOne`和`like`选项

## 关联

在关联关系中，Sequelize有两种不同但相关的定义域理念。这一不同虽然很细小但却很重要：

+ 关联定义域：当获取和设置关联时允许你明确默认的属性，这一方法在处理多元化的关联关系时很有用。这个定义域只在两个模型关联时触发，例如，当使用`get`，`set`，`add`，和`create`关联模型方法。
+ 关联模型上的定义域：当获取关联关系时，允许你设置默认和其他定义域。也允许当创建关联时，传递一个定义域模型。这些定义域既适用于在模型上的常规查找，也适用于通过关联关系查找。

例如，考虑Post和Comment模型。Comment关联到其他几个模型（Image，Video等），并且Comment和其他模型的关系时多元的，这意味着除了`commentable_id`外键外，Comment还存储一个`commentable`栏，

多元关系可以在包含关联定义域中被实现：

```js
this.Post.hasMany(this.Comment, {
  foreignKey: 'commentable_id',
  scope: {
    commentable: 'post'
  }
});
```

当调用`post.getComments()`时，会自动添加`WHERE commentable = 'post'`。同样的，当添加一个新的评论到海报中时，`commentable`会自动设置为`post`。关联定义域存在在后台，所以程序员不需要担心它，这也不可以被禁用。对于更加完整的多元化实例，请查阅[Association scopes](http://docs.sequelizejs.com/manual/associations.html#scopes)。

考虑到Post有一个默认的作用域，它只展示了激活的海报:`where: { active: true }`。这一作用域依赖于关联模型（Post），而不是像`commentable`定义域所做的关系那样。就像调用`Post.findAll()`，默认定义域就会应用，当调用`User.getPosts()`，默认定义域也会应用。这意味着，返回给用户的只有启动的海报。

为了禁用默认的定义域，传递`scope:null`到`getter`中：`User.getPosts({scope:null})`。同样的，如果你想要适用于其他的定义域，传递你想传递的数组到`.scope`：

```js
User.getPosts({ scope: ['scope1', 'scope2']});
```

如果你想在关联的模型上创建一个快捷方法，你可以传递模型定义域到关联关系上。例如，为一个用户快速的获取所有删除的海报：

```js
class Post extends Model {}
Post.init(attributes, {
  defaultScope: {
    where: {
      active: true
    }
  },
  scopes: {
    deleted: {
      where: {
        deleted: true
      }
    }
  },
  sequelize,
});

User.hasMany(Post); // regular getPosts association
User.hasMany(Post.scope('deleted'), { as: 'deletedPosts' });
```

```js
User.getPosts(); // WHERE active = true
User.getDeletedPosts(); // WHERE deleted = true
```

