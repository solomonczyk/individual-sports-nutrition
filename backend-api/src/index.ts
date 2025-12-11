import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config/env'
import { logger } from './utils/logger'
import { errorHandler } from './middlewares/error-handler'
import { notFoundHandler } from './middlewares/not-found'
import routes from './routes'

const app = express()

app.use(helmet())
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(`/api/${config.API_VERSION}`, routes)
app.use(notFoundHandler)
app.use(errorHandler)

const PORT = parseInt(config.PORT, 10)

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    env: config.NODE_ENV,
    apiVersion: config.API_VERSION,
  })
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise })
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error })
  process.exit(1)
})

