import { afterEach, describe, expect, it, vi } from 'vitest'
import { AUTH_COOKIE_NAME, JWT_EXPIRY_SECONDS } from './constants'
import { buildAuthCookie, buildClearAuthCookie } from './cookies'

describe('buildAuthCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sets encoded token with httpOnly, path, sameSite, and max-age', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const cookie = buildAuthCookie('token/with/slashes')

    expect(cookie).toContain(`${AUTH_COOKIE_NAME}=token%2Fwith%2Fslashes`)
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain(`Max-Age=${JWT_EXPIRY_SECONDS}`)
    expect(cookie).not.toContain('Secure')
  })

  it('includes Secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(buildAuthCookie('abc')).toContain('Secure')
  })
})

describe('buildClearAuthCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('clears the auth cookie with max-age 0', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const cookie = buildClearAuthCookie()

    expect(cookie).toContain(`${AUTH_COOKIE_NAME}=`)
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=0')
    expect(cookie).not.toContain('Secure')
  })

  it('includes Secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(buildClearAuthCookie()).toContain('Secure')
  })
})
