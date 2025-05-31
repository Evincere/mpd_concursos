import { UserStatus } from './user.model';

describe('User Model', () => {
  describe('UserStatus enum', () => {
    it('should have the correct values', () => {
      expect(UserStatus.ACTIVE).toBe('ACTIVE');
      expect(UserStatus.INACTIVE).toBe('INACTIVE');
      expect(UserStatus.BLOCKED).toBe('BLOCKED');
      expect(UserStatus.LOCKED).toBe('LOCKED');
      expect(UserStatus.EXPIRED).toBe('EXPIRED');
    });
  });
});
