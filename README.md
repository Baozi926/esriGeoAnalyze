# esriGeoAnalyze
geo Analyze for arcgis javascript 4.0+

因为arcgis JavaScript api 4.0+ 的空间分析并没有出来，所以在项目中若需要用 4以上的api又需要空间分析，就没办法了。
因此，我用4.8的api实现了部分空间分析工具，欢迎感兴趣的小伙伴共同参与完善。


部署步骤
1.放到tomcat下拉，然后你需要一个安装了arcgis portal、arcgis server、arcgis datastore 的环境，记得验证datastore是否安装成功哦。
2.更改根目录下的dojoConfig.js，搞arcgis api 开发的小伙伴应该都懂吧
3.在index.html中更改proxy.jsp为你的部署路径
4.在index.html中更换geoAna这个类的参数，token，username，portalUrl,这三个参数 ，（获取token的方式：在网页中登录portal，然后再开发者工具里面找个带token的请求，复制下来）
