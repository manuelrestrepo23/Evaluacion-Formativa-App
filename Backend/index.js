const mongoose = require('mongoose')
const dotenv = require('dotenv')
const express = require('express')
const cors = require('cors')

dotenv.configure()

const app = express()
app.use(cors())
app.use(express.json())

const URI = process.env.MONGODB_URI


