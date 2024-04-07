const express = require('express')
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws');
const cors = require('cors')
const fs = require("fs")
const path = require("path")
const multer = require('multer');
const uuid = require('uuid')
function asciiEncode(str) {
  const encodedArray = [];
  for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode > 127) {
          throw new Error("ASCII encoding only supports characters in the range 0 to 127.");
      }
      encodedArray.push(charCode);
  }
  return new Uint8Array(encodedArray);
}

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
      const extension = file.originalname.split(".")[file.originalname.split(".").length - 1]
      cb(null, Date.now() + "." + extension);
    }
  })
})





const wss = new WebSocket.Server({ server: server });
let stream;
app.use(cors())
app.post('/upload', upload.single('video'), (req, res) => {
  // Assuming you use middleware to handle file upload and save it as 'video.mp4'
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      const respObj = {
        type: "Video Uploaded",
        url: __dirname + "/" + req.file.destination + "/" + req.file.filename
      }
      var buf = Buffer.from(JSON.stringify(respObj), 'utf-8');

      console.log(buf.copyWithin(1))
      // client.send( __dirname+"/"+req.file.destination+"/"+ req.file.filename);

      client.send(JSON.stringify(respObj));
    }
  });
  res.send({ data: 'Video uploaded successfully' });

});
app.get('/', (req, res) => res.send('Hello World!'))

wss.on('connection', function connection(ws) {
  console.log('A new client Connected!');
  ws.send(JSON.stringify('Welcome New Client!'));

  ws.on('message', (message) => {
    console.log('received: ', message);
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        const msgresp = {
          message,
          type: "message"
        }
        client.send(JSON.stringify(msgresp));
      }
    });
  });
});
server.listen(3002, () => console.log(`Lisening on port :3002`))
