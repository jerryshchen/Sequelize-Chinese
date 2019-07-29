# 读取复制Read\-replication

Sequelize支持读取复制，例如，在当你想要完成一个SELECT查询时，并且有可以连接的多个服务。当你使用读取复制时，你明确一个或多个服务来作为读取副本（read replicas），一个服务来作为写主机（write master），**写**主机会处理所有的写操作并且将它们更新给副本（需要注意的是实际的复制操作不是被Sequelize所处理的，而应该被数据库数据库后端所设置）。

```js
const sequelize = new Sequelize('database', null, null, {
  dialect: 'mysql',
  port: 3306
  replication: {
    read: [
      { host: '8.8.8.8', username: 'read-username', password: 'some-password' },
      { host: '9.9.9.9', username: 'another-username', password: null }
    ],
    write: { host: '1.1.1.1', username: 'write-username', password: 'any-password' }
  },
  pool: { // If you want to override the options used for the read/write pool you can do so here
    max: 20,
    idle: 30000
  },
})
```

如果你有任何普遍的设置需要被所有副本所应用，你不需要在每个实例中设置。在上述代码中，数据库名称和端口传递到所有的副本。如果你在副本中遗漏了这些参数，同样，用户名和密码也会传递到所有的副本。每一个副本都会有下列选项：``host`,`port`,`username`,`password`,`database`。

Sequelize使用连接池来管理你副本的连接。内部地，Sequelize会使用`pool`配置来保持两个连接池被创造。

如果你想修改这些，你可以在实例Sequelize时传递`pool`选项。

每个`write`或`useMaster:true`查询都会使用写操作池。对于`SELECT`，会使用读取池。使用基本的轮回调度算法切换读取副本。

