import { Router } from 'express'
import { ProductController, BrandController } from '../controllers/product-controller'

const router = Router()
const productController = new ProductController()
const brandController = new BrandController()

// Products routes
router.get('/', (req, res, next) => productController.getList(req, res, next))
router.get('/type/:type', (req, res, next) => productController.getByType(req, res, next))
router.get('/:id', (req, res, next) => productController.getById(req, res, next))
router.get('/:id/contraindications', (req, res, next) =>
  productController.getContraindications(req, res, next)
)

// Brands routes
router.get('/brands', (req, res, next) => brandController.getList(req, res, next))
router.get('/brands/:id', (req, res, next) => brandController.getById(req, res, next))

export default router

