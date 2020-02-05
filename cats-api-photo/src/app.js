const {serverPort} = require('./configs');
const app = require('./routes');

app.listen(serverPort);
