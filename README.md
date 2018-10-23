# arcgis 空间分析工具（analyze tools for arcgis javascript api 4.0+）
#### 为 arcgis javascript 4.0+ 打造的空间分析工具

因为arcgis JavaScript api 4.0+ 的空间分析并没有出来，所以在项目中若需要用 4以上的api又需要空间分析，就没办法了。
因此，我用4.8的api实现了部分空间分析工具，欢迎感兴趣的小伙伴共同参与完善。


# 部署步骤

如果是直接放在根目录下，只需要修改index.html中token、username、portalUrl这三个参数（因为此项目是按照一个项目里面的插件来设计的，所以不会独立去获取token，而是在并入项目后，从项目中获取这个参数）。

其他注意事项如下:

1. 首先，你需要一个安装了arcgis portal、arcgis server、arcgis datastore 的环境，记得验证datastore是否安装成功哦。
2. 如果不是放在webapp的根目录下，需要更改根目录下的dojoConfig.js，搞arcgis api 开发的小伙伴应该都懂吧
3. 如果你的项目结构发生改变的话，可能需要在index.html中更改proxy.jsp的路径为你的部署路径。
4. 如果你的项目结构发生改变的话，可能需要在Pane.js里修改REQUIRE_URL_PERFIX变量。


# 开发注意事项

1. 所有空间分析工具需继承BaseTool这个基类，此类提供一个简单的参数验证框架，作用就是能够在用户参数填错或没填的时候告诉用户是那步有问题，空间分析工具继承此类后需用setParam、getParam来设置和获取参数，还需要实现initParam这个方法，initParam里的参数是借鉴vue-elementUI里面的表单验证参数格式来写的，建议参考interpolation-point这个工具来写，此外BaseTool实现其他空间分析工具所共有的基本方法，不用一一在空间分析工具里实现。
2. /geo-ana/config.js这个文件是空间分析列表的配置
3. 空间分析工具都放在tools这个文件夹下

# 目前完成的工具 
+ 缓冲区分析
+ 热点分析
+ 点差值
+ 计算密度
+ 派生新位置
+ 提取数据
+ 查找相似位置
+ 插值点
+ 范围内统计

# 新特性
+ 加入了任务管理

# TODO
+ 完善其他工具

