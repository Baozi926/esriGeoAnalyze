# 空间分析工具
#### 为 arcgis javascript 4.0+ 打造的空间分析工具

因为arcgis JavaScript api 4.0+ 的空间分析并没有出来，所以在项目中若需要用 4以上的api又需要空间分析，就没办法了。
因此，我用4.8的api实现了部分空间分析工具，欢迎感兴趣的小伙伴共同参与完善。


# 部署步骤
1. 放到tomcat下拉，然后你需要一个安装了arcgis portal、arcgis server、arcgis datastore 的环境，记得验证datastore是否安装成功哦。
2. 更改根目录下的dojoConfig.js，搞arcgis api 开发的小伙伴应该都懂吧
3. 在index.html中更改proxy.jsp为你的部署路径。(Pane.js里面有个REQUIRE_URL_PERFIX变量，如果你的项目结构发生改变的话，可能需要修改此变量)
4. 在index.html中更换geoAna这个类的参数，token，username，portalUrl,这三个参数 ，（获取token的方式：在网页中登录portal，然后再开发者工具里面找个带token的请求，复制下来）

# 开发注意事项

1. 所有空间分析工具需继承BaseTool这个基类，此类是一个简单的参数验证框架，作用就是能够在用户参数填错或没填的时候告诉用户是那步有问题，空间分析工具继承此类后需用setParam、getParam来设置和获取参数，还需要实现initParam这个方法，initParam里的参数是借鉴vue-elementUI里面的表单验证参数格式来写的，建议参考interpolation-point这个工具来写。
2. /geo-ana/config.js这个文件是空间分析列表的配置。

# 目前完成的工具 
+ 缓冲区分析
+ 热点分析
+ 点差值
