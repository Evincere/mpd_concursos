import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheService]
    });
    service = TestBed.inject(CacheService);
  });

  afterEach(() => {
    // Limpiar la caché después de cada prueba
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const key = 'testKey';
      const data = { name: 'Test Data' };
      
      service.set(key, data);
      const retrievedData = service.get(key);
      
      expect(retrievedData).toEqual(data);
    });
    
    it('should return null for non-existent key', () => {
      const retrievedData = service.get('nonExistentKey');
      
      expect(retrievedData).toBeNull();
    });
    
    it('should respect TTL and return null for expired items', fakeAsync(() => {
      const key = 'expiringKey';
      const data = { name: 'Expiring Data' };
      
      // Set with 100ms TTL
      service.set(key, data, { ttl: 100 });
      
      // Verify data is available immediately
      expect(service.get(key)).toEqual(data);
      
      // Advance time by 101ms
      tick(101);
      
      // Verify data is now expired
      expect(service.get(key)).toBeNull();
    }));
    
    it('should override existing data with same key', () => {
      const key = 'overrideKey';
      const data1 = { name: 'Original Data' };
      const data2 = { name: 'New Data' };
      
      service.set(key, data1);
      service.set(key, data2);
      
      expect(service.get(key)).toEqual(data2);
    });
  });
  
  describe('remove', () => {
    it('should remove item from cache', () => {
      const key = 'removeKey';
      const data = { name: 'Remove Test' };
      
      service.set(key, data);
      expect(service.get(key)).toEqual(data);
      
      service.remove(key);
      expect(service.get(key)).toBeNull();
    });
    
    it('should not throw error when removing non-existent key', () => {
      expect(() => service.remove('nonExistentKey')).not.toThrow();
    });
  });
  
  describe('clear', () => {
    it('should remove all items from cache', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      
      expect(service.size()).toBe(2);
      
      service.clear();
      
      expect(service.size()).toBe(0);
      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
    });
  });
  
  describe('has', () => {
    it('should return true for existing non-expired key', () => {
      const key = 'existingKey';
      service.set(key, 'value');
      
      expect(service.has(key)).toBe(true);
    });
    
    it('should return false for non-existent key', () => {
      expect(service.has('nonExistentKey')).toBe(false);
    });
    
    it('should return false for expired key', fakeAsync(() => {
      const key = 'expiredKey';
      service.set(key, 'value', { ttl: 100 });
      
      expect(service.has(key)).toBe(true);
      
      tick(101);
      
      expect(service.has(key)).toBe(false);
    }));
  });
  
  describe('keys', () => {
    it('should return all cache keys', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      
      const keys = service.keys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });
    
    it('should return empty array for empty cache', () => {
      const keys = service.keys();
      
      expect(keys).toEqual([]);
    });
  });
  
  describe('size', () => {
    it('should return correct cache size', () => {
      expect(service.size()).toBe(0);
      
      service.set('key1', 'value1');
      expect(service.size()).toBe(1);
      
      service.set('key2', 'value2');
      expect(service.size()).toBe(2);
      
      service.remove('key1');
      expect(service.size()).toBe(1);
      
      service.clear();
      expect(service.size()).toBe(0);
    });
  });
  
  describe('cleanupExpiredItems', () => {
    it('should remove expired items', fakeAsync(() => {
      service.set('nonExpiring', 'value1');
      service.set('expiring1', 'value2', { ttl: 100 });
      service.set('expiring2', 'value3', { ttl: 200 });
      
      expect(service.size()).toBe(3);
      
      tick(150);
      
      service.cleanupExpiredItems();
      
      expect(service.size()).toBe(2);
      expect(service.has('nonExpiring')).toBe(true);
      expect(service.has('expiring1')).toBe(false);
      expect(service.has('expiring2')).toBe(true);
      
      tick(100);
      
      service.cleanupExpiredItems();
      
      expect(service.size()).toBe(1);
      expect(service.has('nonExpiring')).toBe(true);
      expect(service.has('expiring2')).toBe(false);
    }));
  });
  
  describe('cache size management', () => {
    it('should clean up oldest items when cache is full', () => {
      // Set private maxCacheSize to a small value for testing
      const maxCacheSize = 3;
      (service as any).maxCacheSize = maxCacheSize;
      
      // Add items to fill the cache
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');
      
      expect(service.size()).toBe(maxCacheSize);
      
      // Add one more item to trigger cleanup
      service.set('key4', 'value4');
      
      // Cache size should still be maxCacheSize
      expect(service.size()).toBe(maxCacheSize);
      
      // The oldest item should be removed
      expect(service.has('key1')).toBe(false);
      expect(service.has('key2')).toBe(true);
      expect(service.has('key3')).toBe(true);
      expect(service.has('key4')).toBe(true);
    });
  });
});
