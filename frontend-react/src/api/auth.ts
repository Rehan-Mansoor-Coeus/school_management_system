import api from './client'

export function requestPasswordResetOtp(login: string) {
  return api.post('/auth/forgot-password/request-otp', { login })
}

export function verifyPasswordResetOtp(login: string, otp: string) {
  return api.post('/auth/forgot-password/verify-otp', { login, otp })
}

export function resetPassword(payload: { reset_token: string; password: string; password_confirmation: string }) {
  return api.post('/auth/forgot-password/reset', payload)
}

export function changePassword(payload: { current_password: string; password: string; password_confirmation: string }) {
  return api.post('/auth/change-password', payload)
}
