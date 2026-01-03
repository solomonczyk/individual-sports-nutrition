import { ProductMatcher } from '../aggregation/product-matcher';
import { ExternalProduct, InternalProduct } from '../aggregation/types';

describe('ProductMatcher', () => {
  let matcher: ProductMatcher;

  beforeEach(() => {
    matcher = new ProductMatcher();
  });

  describe('matchBySKU', () => {
    it('should match products with same SKU', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'Whey Protein',
        brand: 'Optimum Nutrition',
        sku: 'ON-WP-2LB',
        price: 5000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internal: InternalProduct = {
        id: 'int-1',
        name: 'Whey Protein',
        brand: 'Optimum Nutrition',
        sku: 'ON-WP-2LB',
      };

      const match = matcher.matchBySKU(external, [internal]);
      expect(match).toEqual(internal);
    });

    it('should return null when no SKU match', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'Whey Protein',
        brand: 'Optimum Nutrition',
        sku: 'ON-WP-2LB',
        price: 5000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internal: InternalProduct = {
        id: 'int-1',
        name: 'Whey Protein',
        brand: 'Optimum Nutrition',
        sku: 'DIFFERENT-SKU',
      };

      const match = matcher.matchBySKU(external, [internal]);
      expect(match).toBeNull();
    });
  });

  describe('matchByNameAndBrand', () => {
    it('should match products with exact name and brand', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'Gold Standard Whey',
        brand: 'Optimum Nutrition',
        price: 5000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internal: InternalProduct = {
        id: 'int-1',
        name: 'Gold Standard Whey',
        brand: 'Optimum Nutrition',
      };

      const match = matcher.matchByNameAndBrand(external, [internal]);
      expect(match).toEqual(internal);
    });

    it('should match case-insensitively', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'GOLD STANDARD WHEY',
        brand: 'optimum nutrition',
        price: 5000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internal: InternalProduct = {
        id: 'int-1',
        name: 'Gold Standard Whey',
        brand: 'Optimum Nutrition',
      };

      const match = matcher.matchByNameAndBrand(external, [internal]);
      expect(match).toEqual(internal);
    });
  });

  describe('fuzzyMatch', () => {
    it('should match similar product names', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'Gold Standard 100% Whey Protein',
        brand: 'Optimum Nutrition',
        price: 5000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internal: InternalProduct = {
        id: 'int-1',
        name: 'Gold Standard Whey',
        brand: 'Optimum Nutrition',
      };

      const match = matcher.fuzzyMatch(external, [internal], 0.7);
      expect(match).toBeTruthy();
      expect(match?.product).toEqual(internal);
      expect(match?.confidence).toBeGreaterThan(0.7);
    });

    it('should not match dissimilar products', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'Creatine Monohydrate',
        brand: 'Optimum Nutrition',
        price: 3000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internal: InternalProduct = {
        id: 'int-1',
        name: 'Gold Standard Whey',
        brand: 'Optimum Nutrition',
      };

      const match = matcher.fuzzyMatch(external, [internal], 0.7);
      expect(match).toBeNull();
    });
  });

  describe('findBestMatch', () => {
    it('should prioritize SKU match', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'Whey Protein',
        brand: 'Optimum Nutrition',
        sku: 'ON-WP-2LB',
        price: 5000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internalProducts: InternalProduct[] = [
        {
          id: 'int-1',
          name: 'Different Product',
          brand: 'Different Brand',
          sku: 'ON-WP-2LB',
        },
        {
          id: 'int-2',
          name: 'Whey Protein',
          brand: 'Optimum Nutrition',
        },
      ];

      const match = matcher.findBestMatch(external, internalProducts);
      expect(match?.product.id).toBe('int-1');
      expect(match?.matchType).toBe('sku');
    });

    it('should fall back to name match when no SKU', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'Whey Protein',
        brand: 'Optimum Nutrition',
        price: 5000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internalProducts: InternalProduct[] = [
        {
          id: 'int-1',
          name: 'Whey Protein',
          brand: 'Optimum Nutrition',
        },
      ];

      const match = matcher.findBestMatch(external, internalProducts);
      expect(match?.product.id).toBe('int-1');
      expect(match?.matchType).toBe('exact');
    });

    it('should use fuzzy match as last resort', () => {
      const external: ExternalProduct = {
        external_id: 'ext-1',
        name: 'Gold Standard 100% Whey',
        brand: 'Optimum Nutrition',
        price: 5000,
        currency: 'RSD',
        in_stock: true,
        url: 'https://example.com/product',
      };

      const internalProducts: InternalProduct[] = [
        {
          id: 'int-1',
          name: 'Gold Standard Whey',
          brand: 'Optimum Nutrition',
        },
      ];

      const match = matcher.findBestMatch(external, internalProducts);
      expect(match?.product.id).toBe('int-1');
      expect(match?.matchType).toBe('fuzzy');
    });
  });
});
