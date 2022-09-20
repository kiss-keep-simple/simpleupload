const os = require('os')
const express = require('express');
const serveIndex = require('serve-index')

const http = require('http');
const busboy = require('busboy');
const fs = require('fs');
const path = require('path');

const portDownload = 8080
const portUpload = 3000
var dirUpload = 'upload';

if (!fs.existsSync(dirUpload)) {
  fs.mkdirSync(dirUpload, { recursive: true });
}


const serverIp = Object.values(os.networkInterfaces())
  .flat()
  .filter((item) => !item.internal && item.family === "IPv4")
  .find(Boolean).address;

console.log("IP: " + serverIp)

var serverDownload = express();
serverDownload.use(express.static(__dirname), serveIndex(__dirname, { 'icons': true }));
serverDownload.listen(portDownload);
console.log("serverDownload is running in port " + serverIp + ":" + portDownload)
console.log('Folder upload: http://' + serverIp + ":" + portDownload + '/' + dirUpload)

const serverUpload = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <form action="/upload" enctype="multipart/form-data" method="post">
        <input type="file" name="someCoolFiles" multiple>
        <br><br>
        Folder upload: ${dirUpload}.<br>Files: Overwrite if exist.
        <br><br>
        <button>Upload</button>
      </form>
      <br>
      <a href="./" onclick="javascript:event.target.port=${portDownload}">View files</a>
    `);
  } else if (req.url === '/upload') {
    let filename = '';
    let filenames = []
    const bb = busboy({ headers: req.headers });
    bb.on('file', (name, file, info) => {
      filename = info.filename;
      filenames.push(filename);

      const saveTo = path.join(__dirname, dirUpload, filename);
      file.pipe(fs.createWriteStream(saveTo));
      console.log('upload', filename)
    });
    bb.on('close', () => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`upload success: Folder ${serverIp}:${portDownload}/${dirUpload} 
      ${'\n' + filenames.map(el => `<br><a href="http://${serverIp}:${portDownload}/${dirUpload}/${el}">${serverIp}:${portDownload}/${dirUpload}/${el}</a>`)}`);
    });
    req.pipe(bb);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');
  }
});

serverUpload.listen(portUpload, () => {
  console.log('ServerUpload is listening on port ' + serverIp + ":" + portUpload + ' ... ');
});



