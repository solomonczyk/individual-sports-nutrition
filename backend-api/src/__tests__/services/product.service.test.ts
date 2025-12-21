import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../../src/services/product.service';
import { IProductRepository } from '../../src/repositories/product.repository';
import { ICacheService } from '../../src/services/cache.service';

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepository: any;
  let mockCacheService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProductRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCategory: vi.fn(),
      findByName: vi.fn(),
      findByBarcode: vi.fn(),
      search: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByIds: vi.fn(),
    };

    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    };

    productService = new ProductService(
      mockProductRepository,
      mockCacheService
    );
  });

  describe('Get Product by ID', () => {
    it('should return cached product if available', async () => {
      // Arrange
      const productId = 'prod_123';
      const cachedProduct = {
        id: productId,
        name: 'Chicken Breast',
        category: 'Protein',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
      };

      mockCacheService.get.mockResolvedValue(cachedProduct);

      // Act
      const result = await productService.getProductById(productId);

      // Assert
      expect(mockCacheService.get).toHaveBeenCalledWith(`product:${productId}`);
      expect(mockProductRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedProduct);
    });

    it('should fetch from repository and cache if not cached', async () => {
      // Arrange
      const productId = 'prod_123';
      const product = {
        id: productId,
        name: 'Chicken Breast',
        category: 'Protein',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockProductRepository.findById.mockResolvedValue(product);

      // Act
      const result = await productService.getProductById(productId);

      // Assert
      expect(mockCacheService.get).toHaveBeenCalledWith(`product:${productId}`);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `product:${productId}`,
        product,
        3600 // 1 hour TTL
      );
      expect(result).toEqual(product);
    });

    it('should throw error for non-existent product', async () => {
      // Arrange
      const productId = 'non_existent';

      mockCacheService.get.mockResolvedValue(null);
      mockProductRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        productService.getProductById(productId)
      ).rejects.toThrow('Product not found');
    });
  });

  describe('Get All Products', () => {
    it('should return paginated products', async () => {
      // Arrange
      const page = 1;
      const limit = 20;
      const products = [
        {
          id: 'prod_1',
          name: 'Chicken Breast',
          category: 'Protein',
          calories: 165,
        },
        {
          id: 'prod_2',
          name: 'Brown Rice',
          category: 'Carbs',
          calories: 111,
        },
      ];

      mockProductRepository.findAll.mockResolvedValue({
        data: products,
        total: 100,
        page: page,
        limit: limit,
        pages: 5,
      });

      // Act
      const result = await productService.getAllProducts(page, limit);

      // Assert
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(
        page,
        limit
      );
      expect(result).toEqual({
        data: products,
        total: 100,
        page: page,
        limit: limit,
        pages: 5,
      });
    });

    it('should use default pagination values', async () => {
      // Arrange
      mockProductRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
      });

      // Act
      await productService.getAllProducts();

      // Assert
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(1, 20);
    });

    it('should validate pagination parameters', async () => {
      // Arrange
      const invalidPage = 0;
      const invalidLimit = -1;

      // Act & Assert
      await expect(
        productService.getAllProducts(invalidPage, invalidLimit)
      ).rejects.toThrow();
    });

    it('should handle maximum page limit', async () => {
      // Arrange
      const page = 1;
      const limit = 10000; // Exceeds max of 100

      mockProductRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: page,
        limit: 100, // Should be capped at 100
        pages: 0,
      });

      // Act
      await productService.getAllProducts(page, limit);

      // Assert
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(page, 100);
    });
  });

  describe('Search Products', () => {
    it('should search products by name', async () => {
      // Arrange
      const query = 'chicken';
      const results = [
        { id: 'prod_1', name: 'Chicken Breast', category: 'Protein' },
        { id: 'prod_2', name: 'Chicken Thigh', category: 'Protein' },
      ];

      mockProductRepository.search.mockResolvedValue(results);

      // Act
      const result = await productService.searchProducts(query);

      // Assert
      expect(mockProductRepository.search).toHaveBeenCalledWith(query);
      expect(result).toEqual(results);
    });

    it('should trim and lowercase search query', async () => {
      // Arrange
      const query = '  CHICKEN  ';

      mockProductRepository.search.mockResolvedValue([]);

      // Act
      await productService.searchProducts(query);

      // Assert
      expect(mockProductRepository.search).toHaveBeenCalledWith('chicken');
    });

    it('should return empty results for no matches', async () => {
      // Arrange
      const query = 'nonexistent_product';

      mockProductRepository.search.mockResolvedValue([]);

      // Act
      const result = await productService.searchProducts(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle minimum query length', async () => {
      // Arrange
      const query = 'a'; // Too short

      // Act & Assert
      await expect(
        productService.searchProducts(query)
      ).rejects.toThrow('Search query must be at least 2 characters');
    });
  });

  describe('Filter Products', () => {
    it('should filter products by category', async () => {
      // Arrange
      const category = 'Protein';
      const products = [
        {
          id: 'prod_1',
          name: 'Chicken Breast',
          category: 'Protein',
          calories: 165,
        },
        {
          id: 'prod_2',
          name: 'Salmon',
          category: 'Protein',
          calories: 206,
        },
      ];

      mockProductRepository.findByCategory.mockResolvedValue(products);

      // Act
      const result = await productService.filterByCategory(category);

      // Assert
      expect(mockProductRepository.findByCategory).toHaveBeenCalledWith(
        category
      );
      expect(result).toEqual(products);
    });

    it('should filter products by macronutrient ranges', async () => {
      // Arrange
      const filters = {
        minProtein: 20,
        maxProtein: 40,
        minCalories: 150,
        maxCalories: 250,
      };

      const products = [
        {
          id: 'prod_1',
          name: 'Chicken Breast',
          calories: 165,
          protein: 31,
        },
      ];

      mockProductRepository.findAll.mockResolvedValue({
        data: products,
        total: 1,
        page: 1,
        limit: 20,
        pages: 1,
      });

      // Act
      const result = await productService.filterByMacros(filters);

      // Assert
      expect(result.data).toEqual(products);
      expect(result.data[0].protein).toBeGreaterThanOrEqual(filters.minProtein);
      expect(result.data[0].protein).toBeLessThanOrEqual(filters.maxProtein);
    });

    it('should exclude products with allergens', async () => {
      // Arrange
      const allergens = ['gluten', 'dairy'];
      const products = [
        {
          id: 'prod_1',
          name: 'Rice',
          allergens: [],
        },
        {
          id: 'prod_2',
          name: 'Bread',
          allergens: ['gluten'], // Should be excluded
        },
      ];

      mockProductRepository.findAll.mockResolvedValue({
        data: products,
        total: 2,
        page: 1,
        limit: 20,
        pages: 1,
      });

      // Act
      const result = await productService.filterByAllergens(allergens);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Rice');
    });

    it('should filter products by price range', async () => {
      // Arrange
      const minPrice = 2.0;
      const maxPrice = 8.0;

      const products = [
        {
          id: 'prod_1',
          name: 'Chicken Breast',
          price: 6.99,
        },
        {
          id: 'prod_2',
          name: 'Salmon',
          price: 12.99, // Exceeds max
        },
      ];

      mockProductRepository.findAll.mockResolvedValue({
        data: products,
        total: 2,
        page: 1,
        limit: 20,
        pages: 1,
      });

      // Act
      const result = await productService.filterByPrice(minPrice, maxPrice);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].price).toBeLessThanOrEqual(maxPrice);
    });
  });

  describe('Get Product by Barcode', () => {
    it('should find product by barcode', async () => {
      // Arrange
      const barcode = '8901234567890';
      const product = {
        id: 'prod_123',
        name: 'Chicken Breast',
        barcode: barcode,
        category: 'Protein',
      };

      mockProductRepository.findByBarcode.mockResolvedValue(product);

      // Act
      const result = await productService.getProductByBarcode(barcode);

      // Assert
      expect(mockProductRepository.findByBarcode).toHaveBeenCalledWith(barcode);
      expect(result).toEqual(product);
    });

    it('should throw error for invalid barcode', async () => {
      // Arrange
      const invalidBarcode = 'abc123'; // Invalid format

      // Act & Assert
      await expect(
        productService.getProductByBarcode(invalidBarcode)
      ).rejects.toThrow('Invalid barcode format');
    });

    it('should throw error for non-existent barcode', async () => {
      // Arrange
      const barcode = '8901234567890';

      mockProductRepository.findByBarcode.mockResolvedValue(null);

      // Act & Assert
      await expect(
        productService.getProductByBarcode(barcode)
      ).rejects.toThrow('Product not found');
    });
  });

  describe('Bulk Operations', () => {
    it('should get multiple products by IDs', async () => {
      // Arrange
      const productIds = ['prod_1', 'prod_2', 'prod_3'];
      const products = [
        { id: 'prod_1', name: 'Chicken Breast' },
        { id: 'prod_2', name: 'Rice' },
        { id: 'prod_3', name: 'Broccoli' },
      ];

      mockProductRepository.findByIds.mockResolvedValue(products);

      // Act
      const result = await productService.getProductsByIds(productIds);

      // Assert
      expect(mockProductRepository.findByIds).toHaveBeenCalledWith(productIds);
      expect(result).toEqual(products);
    });

    it('should handle missing products in bulk get', async () => {
      // Arrange
      const productIds = ['prod_1', 'prod_2', 'non_existent'];
      const products = [
        { id: 'prod_1', name: 'Chicken Breast' },
        { id: 'prod_2', name: 'Rice' },
      ];

      mockProductRepository.findByIds.mockResolvedValue(products);

      // Act
      const result = await productService.getProductsByIds(productIds);

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe('Product Creation and Update', () => {
    it('should create a new product', async () => {
      // Arrange
      const productData = {
        name: 'Chicken Breast',
        category: 'Protein',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        barcode: '8901234567890',
        price: 6.99,
      };

      const createdProduct = {
        id: 'prod_123',
        ...productData,
        createdAt: new Date(),
      };

      mockProductRepository.create.mockResolvedValue(createdProduct);

      // Act
      const result = await productService.createProduct(productData);

      // Assert
      expect(mockProductRepository.create).toHaveBeenCalledWith(productData);
      expect(result).toEqual(createdProduct);
    });

    it('should validate product data on creation', async () => {
      // Arrange
      const invalidProductData = {
        name: '', // Empty name
        category: 'Protein',
        calories: -100, // Negative calories
        protein: 31,
      } as any;

      // Act & Assert
      await expect(
        productService.createProduct(invalidProductData)
      ).rejects.toThrow();
    });

    it('should update an existing product', async () => {
      // Arrange
      const productId = 'prod_123';
      const updateData = {
        price: 7.99,
        category: 'Premium Protein',
      };

      const updatedProduct = {
        id: productId,
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        ...updateData,
      };

      mockProductRepository.update.mockResolvedValue(updatedProduct);

      // Act
      const result = await productService.updateProduct(productId, updateData);

      // Assert
      expect(mockProductRepository.update).toHaveBeenCalledWith(
        productId,
        updateData
      );
      expect(result).toEqual(updatedProduct);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`product:${productId}`);
    });

    it('should delete a product', async () => {
      // Arrange
      const productId = 'prod_123';

      mockProductRepository.delete.mockResolvedValue(true);

      // Act
      await productService.deleteProduct(productId);

      // Assert
      expect(mockProductRepository.delete).toHaveBeenCalledWith(productId);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`product:${productId}`);
    });
  });

  describe('Product Nutrition Information', () => {
    it('should calculate nutrition for portion', async () => {
      // Arrange
      const product = {
        id: 'prod_123',
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        servingSize: 100, // grams
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockCacheService.get.mockResolvedValue(null);

      // Act
      const result = await productService.getNutritionForPortion(
        'prod_123',
        150 // 150 grams
      );

      // Assert
      expect(result).toEqual({
        calories: 247.5, // 165 * 150 / 100
        protein: 46.5, // 31 * 150 / 100
        carbs: 0,
        fat: 5.4, // 3.6 * 150 / 100
      });
    });

    it('should handle percentage-based macros', async () => {
      // Arrange
      const product = {
        id: 'prod_123',
        name: 'Mixed Meal',
        calories: 500,
        proteinPercent: 30,
        carbsPercent: 50,
        fatPercent: 20,
      };

      mockProductRepository.findById.mockResolvedValue(product);
      mockCacheService.get.mockResolvedValue(null);

      // Act
      const result = await productService.calculateMacroBreakdown('prod_123');

      // Assert
      expect(result.protein).toBeCloseTo(37.5, 1); // 500 * 0.30 / 4
      expect(result.carbs).toBeCloseTo(62.5, 1); // 500 * 0.50 / 4
      expect(result.fat).toBeCloseTo(25, 1); // 500 * 0.20 / 9
    });
  });
});
