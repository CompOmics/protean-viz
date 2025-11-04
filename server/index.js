const express = require('express')
const app = express()
const cors = require('cors')

app.listen(3050, () => {
      console.log('server listening on port 3050')
})

app.get('/', (req, res) => {
      res.send('Hello from our server!')
})