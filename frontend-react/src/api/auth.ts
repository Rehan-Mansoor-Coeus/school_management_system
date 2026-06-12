import api from './client'

export function fetchPublicAuthInstitutions() {
  return api.get('/auth/institutions')
}

export function requestSignupOtp(institution_id: number, phone_number: string) {
  return api.post('/auth/signup/request-otp', { institution_id, phone_number })
}

export function verifySignupOtp(institution_id: number, phone_number: string, otp: string) {
  return api.post('/auth/signup/verify-otp', { institution_id, phone_number, otp })
}

export function completeStudentSignup(payload: {
  signup_token: string
  institution_id: number
  name: string
  username: string
  email?: string
  password: string
  password_confirmation: string
  phone_number: string
  address?: string
}) {
  return api.post('/auth/signup/complete', payload)
}

export function requestForgotUsername(phone_number: string) {
  return api.post('/auth/forgot-username', { phone_number })
}

export function requestPasswordResetOtp(phone_number: string) {
  return api.post('/auth/forgot-password/request-otp', { phone_number })
}

export function verifyPasswordResetOtp(phone_number: string, otp: string) {
  return api.post('/auth/forgot-password/verify-otp', { phone_number, otp })
}

export function resetPassword(payload: { reset_token: string; password: string; password_confirmation: string }) {
  return api.post('/auth/forgot-password/reset', payload)
}

export function changePassword(payload: { current_password: string; password: string; password_confirmation: string }) {
  return api.post('/auth/change-password', payload)
}
