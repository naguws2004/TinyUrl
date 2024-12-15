const Server3000 = require('./server3000');
const Server80 = require('./server80');

const port3000 = process.env.PORT || 3000;
const server3000 = new Server3000(port3000);
const port80 = process.env.PORT || 80;
const server80 = new Server80(port80);

server3000.start();
server80.start();