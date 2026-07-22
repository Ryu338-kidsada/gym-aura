import type { User, Workout } from './types'

// In Docker, Nginx forwards /api to the internal API container. Keeping this
// relative also avoids a browser request to an unpublished localhost:3000 port.
const API = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('gymaura_token')
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
  return data
}

export const api = {
  login: (email: string, password: string) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  workouts: () => request<Workout[]>('/workouts'),
  createWorkout: (workout: Omit<Workout, 'id'>) => request<Workout>('/workouts', { method: 'POST', body: JSON.stringify(workout) }),
  updateWorkout: (id: number, workout: Omit<Workout, 'id'>) => request<Workout>(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(workout) }),
  deleteWorkout: (id: number) => request<void>(`/workouts/${id}`, { method: 'DELETE' }),
}
