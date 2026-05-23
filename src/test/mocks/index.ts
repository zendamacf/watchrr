import './db';
import { mockLimit, mockReturning, resetDbMocks } from './db';
import './password';
import { mockHashPassword, mockVerifyPassword, resetPasswordMocks } from './password';

export { mockHashPassword, mockLimit, mockReturning, mockVerifyPassword, resetDbMocks, resetPasswordMocks };

export function resetAuthMocks() {
  resetDbMocks();
  resetPasswordMocks();
}
