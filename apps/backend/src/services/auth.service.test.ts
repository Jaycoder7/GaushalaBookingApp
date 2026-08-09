import { generateToken, validateAdminEmail, verifyToken } from './auth.service';
import { verifyCaptcha } from './captcha.service';

describe('admin authentication', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('only accepts the configured admin email, case-insensitively', () => {
    process.env.GOOGLE_ADMIN_EMAIL = 'Owner@Example.com';

    expect(validateAdminEmail('owner@example.com')).toBe(true);
    expect(validateAdminEmail('someone@example.com')).toBe(false);
  });

  it('creates and verifies an application token', () => {
    process.env.JWT_SECRET = 'a-test-secret-long-enough-for-tests';
    const payload = { email: 'owner@example.com', sub: 'google-user-id' };

    const token = generateToken(payload);

    expect(verifyToken(token)).toMatchObject(payload);
  });
});

describe('development CAPTCHA behavior', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('allows the explicit development bypass only outside production', async () => {
    delete process.env.HCAPTCHA_SECRET_KEY;
    process.env.NODE_ENV = 'development';

    await expect(verifyCaptcha('development-bypass')).resolves.toBe(true);
    await expect(verifyCaptcha('')).resolves.toBe(false);
  });

  it('fails closed when the production secret is absent', async () => {
    delete process.env.HCAPTCHA_SECRET_KEY;
    process.env.NODE_ENV = 'production';

    await expect(verifyCaptcha('development-bypass')).resolves.toBe(false);
  });
});
