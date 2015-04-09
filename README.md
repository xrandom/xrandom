xRandom
=======

Dependencies:
- NodeJS
- nginx
- elasticsearch
- python

How to run?
-----------

Firstly, set up nginx:

```
server {
  listen 3031;
  server_name localhost;

  # serve static
  location / {
	  root /path/to/xrandom/static;
	  try_files $uri $uri.html $uri/index.html index.html =404;
  }

  # proxy to node js 
  location ^~ /search/ {
    # 5678 - node application port 
    proxy_pass http://127.0.0.1:5678/;
    proxy_set_header Host $host;
    add_header Access-Control-Allow-Origin *;
  }
}
```
and reload nginx: `sudo service nginx reload`

### Easy start without search

```
cp ./config/config.ex.js ./config/config.js
npm install
grunt
node app.js
```
and open in browser http://localhost:3031

### Enable searching

1. Install elasticsearch https://www.elastic.co/downloads/elasticsearch
2. Run elasticsearch as application or daemon
3. Get data from eporner, create elasticsearch index and list of video ids using this:
```
cd ./tools
./getdata.sh
python elasticsearchcreator.py > ./../data
```
It takes time. 
(Re)start node application.

For developing
--------------

Use `grunt watch` to watch css and js files changing 
