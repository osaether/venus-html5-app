const cypress = require("cypress")
const httpServer = require("http-server")
const mockMQTT = require("../scripts/fake-broker.js").MockMQQTBroker

const server = httpServer.createServer({
  root: "dist/"
})

const mqtt = new mockMQTT()

server.listen(8000)

cypress
  .run()
  .then(res => {
    server.close()
    mqtt.server.close()
    process.exit(res.totalFailed)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
