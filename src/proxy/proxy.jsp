<%@page session="false"%>
<%@page import="java.net.*,java.io.*"%>
<%!
String[] serverUrls = {
  //"<url>[,<token>]"
  //For ex. (secured server): "http://myserver.mycompany.com/arcgis/rest/services,ayn2C2iPvqjeqWoXwV6rjmr43kyo23mhIPnXz2CEiMA6rVu0xR0St8gKsd0olv8a"
  //For ex. (non-secured server): "http://sampleserver1.arcgisonline.com/arcgis/rest/services"
  "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
  "http://beta.arcgisonline.cn/",
  "https://open.t.qq.com/api/search",
  "http://api.weibo.com/oauth2/access_token",
  "http://www.weather.com.cn/data/",
  "http://m.weather.com.cn/data/",
  "http://tm.arcgisonline.cn:8038/arcgis/",
  "http://192.168.120.103:8080/ImageManagerService/",
  "http://map.geoq.cn/",
  "https://rongc.arcgislocal.com/",
  "https://esri.cjw/",
  "http://sampleserver2.arcgisonline.com/arcgis/rest/services" //NOTE - no comma after the last item
};
%>
<%
try {
  String reqUrl = request.getQueryString();
  boolean allowed = false;
  String token = null;
  allowed = true;
  if(!allowed) {
    response.setStatus(403);
    return;
  }
  URL url = new URL(reqUrl);
	HttpURLConnection con = (HttpURLConnection)url.openConnection();
	con.setDoOutput(true);
	con.setRequestMethod(request.getMethod());
	if(request.getContentType() != null) {
	  con.setRequestProperty("Content-Type", request.getContentType());
	}
  con.setRequestProperty("Referer", request.getHeader("Referer"));
	int clength = request.getContentLength();
	if(clength > 0) {
		con.setDoInput(true);
		InputStream istream = request.getInputStream();
		OutputStream os = con.getOutputStream();
		final int length = 5000;
	  byte[] bytes = new byte[length];
	  int bytesRead = 0;
	  while ((bytesRead = istream.read(bytes, 0, length)) > 0) {
	    os.write(bytes, 0, bytesRead);
	  }
	}
  else {
    con.setRequestMethod("GET");
  }
	out.clear();
  out = pageContext.pushBody();
	OutputStream ostream = response.getOutputStream();
	response.setContentType(con.getContentType());
	InputStream in = con.getInputStream();
	final int length = 5000;
  byte[] bytes = new byte[length];
  int bytesRead = 0;
  while ((bytesRead = in.read(bytes, 0, length)) > 0) {
    ostream.write(bytes, 0, bytesRead);
  }
} catch(Exception e) {
	e.printStackTrace();
	response.setStatus(500);
}
%>
