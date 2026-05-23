import './db';
import { mockLimit, mockReturning, resetDbMocks } from './db';
import './password';
import { mockHashPassword, mockVerifyPassword, resetPasswordMocks } from './password';

export { mockLimit, mockReturning, resetDbMocks, mockHashPassword, mockVerifyPassword, resetPasswordMocks };

export function resetAuthMocks() {
  resetDbMocks();
  resetPasswordMocks();
}
