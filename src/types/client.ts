export interface Client {
  id?: string
  userId: string
  name: string
  email?: string
  address: string
  country: string
  currency: string
  createdAt: Date
  updatedAt: Date
}
