export type Workout = {
  id: number
  title: string
  category: string
  duration: number
  calories: number
  workout_date: string
  notes: string | null
}

export type User = { id: number; name: string; email: string }
