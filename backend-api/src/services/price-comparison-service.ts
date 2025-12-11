import { ProductPriceRepository, StoreRepository, ProductPackageRepository } from '../repositories/store-repository'
import { Product } from '../models/product'
import { PriceComparison, ProductPackage } from '../models/store'
import { DosageRequirements } from './dosage-calculator'

export interface ShoppingOption {
  store_id: string
  store_name: string
  store_slug: string
  store_logo: string | null
  items: Array<{
    product_id: string
    product_name: string
    package_id: string | null
    package_weight: number | null
    package_quantity: number
    unit_price: number
    total_price: number
    discount_price: number | null
  }>
  subtotal: number
  delivery_fee: number
  min_order_amount: number | null
  total_cost: number
  meets_minimum_order: boolean
}

export class PriceComparisonService {
  private priceRepository: ProductPriceRepository
  private storeRepository: StoreRepository
  private packageRepository: ProductPackageRepository

  constructor() {
    this.priceRepository = new ProductPriceRepository()
    this.storeRepository = new StoreRepository()
    this.packageRepository = new ProductPackageRepository()
  }

  /**
   * Получить сравнение цен для одного продукта из разных магазинов
   */
  async compareProductPrices(
    productId: string,
    packageId: string | null = null
  ): Promise<PriceComparison[]> {
    const comparisons = await this.priceRepository.getPriceComparison(productId, packageId)

    return comparisons.map((item) => {
      const finalPrice = item.discount_price || item.price
      const deliveryFee = item.store.delivery_fee || 0
      
      return {
        store: item.store,
        price: item,
        package: null, // будет добавлено если нужно
        total_cost: finalPrice,
        delivery_cost: deliveryFee,
        final_cost: finalPrice + deliveryFee,
      }
    })
  }

  /**
   * Найти оптимальные варианты покупки для списка продуктов (как e-ponuda)
   * Возвращает варианты: купить все в одном магазине или распределить по магазинам
   */
  async findOptimalShoppingOptions(
    requirements: DosageRequirements[],
    products: Product[]
  ): Promise<ShoppingOption[]> {
    // Получаем все магазины
    const stores = await this.storeRepository.findAll(true)
    
    // Для каждого магазина считаем стоимость закупки всех продуктов
    const options: ShoppingOption[] = []

    for (const store of stores) {
      const option = await this.calculateStoreOption(store.id, requirements, products)
      if (option) {
        options.push(option)
      }
    }

    // Сортируем по общей стоимости
    return options.sort((a, b) => a.total_cost - b.total_cost)
  }

  /**
   * Рассчитать стоимость покупки всех продуктов в конкретном магазине
   */
  private async calculateStoreOption(
    storeId: string,
    requirements: DosageRequirements[],
    products: Product[]
  ): Promise<ShoppingOption | null> {
    const store = await this.storeRepository.findById(storeId)
    if (!store) {
      return null
    }

    const items: ShoppingOption['items'] = []
    let subtotal = 0

    for (const req of requirements) {
      const product = products.find((p) => p.id === req.product_id)
      if (!product) {
        continue
      }

      // Получаем упаковки продукта
      const packages = await this.packageRepository.findByProductId(product.id)
      
      if (packages.length === 0) {
        // Если нет упаковок, ищем цену на базовый продукт
        const productPrice = await this.priceRepository.findByProductAndStore(product.id, storeId)
        if (!productPrice || !productPrice.in_stock) {
          // Продукт недоступен в этом магазине
          return null
        }

        // Рассчитываем количество (используем вес продукта или стандартную порцию)
        const packageWeight = 1000 // предполагаем 1кг по умолчанию
        const totalGramsNeeded = req.daily_grams * req.duration_days
        const packageQuantity = Math.ceil(totalGramsNeeded / packageWeight)

        const unitPrice = productPrice.discount_price || productPrice.price
        const totalPrice = unitPrice * packageQuantity

          items.push({
            product_id: product.id,
            product_name: product.name_key,
            package_id: null,
            package_weight: packageWeight,
            package_quantity: packageQuantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            discount_price: productPrice.discount_price,
          })

        subtotal += totalPrice
      } else {
        // Есть упаковки - находим лучшую комбинацию
        const bestPackage = this.findBestPackage(packages, req.daily_grams * req.duration_days)
        
        const price = await this.priceRepository.findByProductAndStore(
          product.id,
          storeId
        )
        
        // Ищем цену на эту упаковку
        const packagePrice = await this.priceRepository.findByProductPackage(
          product.id,
          bestPackage.id
        ).then((prices) => prices.find((p) => p.store_id === storeId))

        if (!packagePrice || !packagePrice.in_stock) {
          // Проверяем базовую цену продукта
          const basePrice = await this.priceRepository.findByProductAndStore(product.id, storeId)
          if (!basePrice || !basePrice.in_stock) {
            return null
          }

          const unitPrice = basePrice.discount_price || basePrice.price
          const packageQuantity = bestPackage.quantity
          const totalPrice = unitPrice * packageQuantity

          items.push({
            product_id: product.id,
            product_name: product.name_key,
            package_id: bestPackage.id,
            package_weight: bestPackage.weight_grams,
            package_quantity: packageQuantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            discount_price: basePrice.discount_price,
          })

          subtotal += totalPrice
        } else {
          const unitPrice = packagePrice.discount_price || packagePrice.price
          const packageQuantity = bestPackage.quantity
          const totalPrice = unitPrice * packageQuantity

          items.push({
            product_id: product.id,
            product_name: product.name_key,
            package_id: bestPackage.id,
            package_weight: bestPackage.weight_grams,
            package_quantity: packageQuantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            discount_price: packagePrice.discount_price,
          })

          subtotal += totalPrice
        }
      }
    }

    const deliveryFee = store.delivery_fee || 0
    const minOrderAmount = store.min_order_amount || 0
    const meetsMinimumOrder = minOrderAmount === 0 || subtotal >= minOrderAmount
    const totalCost = subtotal + (meetsMinimumOrder ? deliveryFee : 0)

    return {
      store_id: store.id,
      store_name: store.name,
      store_slug: store.slug,
      store_logo: store.logo_url,
      items,
      subtotal,
      delivery_fee: deliveryFee,
      min_order_amount: minOrderAmount,
      total_cost: totalCost,
      meets_minimum_order: meetsMinimumOrder,
    }
  }

  /**
   * Найти лучшую упаковку для необходимого количества
   */
  private findBestPackage(
    packages: ProductPackage[],
    totalGramsNeeded: number
  ): { id: string; weight_grams: number | null; quantity: number } {
    // Сортируем упаковки по размеру (от большей к меньшей)
    const sorted = packages
      .filter((p) => p.weight_grams && p.weight_grams > 0)
      .sort((a, b) => (b.weight_grams || 0) - (a.weight_grams || 0))

    if (sorted.length === 0) {
      // Если нет упаковок с весом, берем первую
      return {
        id: packages[0].id,
        weight_grams: null,
        quantity: 1,
      }
    }

    // Пытаемся найти оптимальную упаковку (минимальное количество упаковок)
    let bestPackage = sorted[0]
    let minPackages = Math.ceil(totalGramsNeeded / (bestPackage.weight_grams || 1))
    
    for (const pkg of sorted) {
      const packagesNeeded = Math.ceil(totalGramsNeeded / (pkg.weight_grams || 1))
      if (packagesNeeded < minPackages) {
        minPackages = packagesNeeded
        bestPackage = pkg
      }
    }

    return {
      id: bestPackage.id,
      weight_grams: bestPackage.weight_grams,
      quantity: minPackages,
    }
  }
}

