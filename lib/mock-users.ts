export interface User {
  id: string
  username: string
  password: string
  name: string
  role: string
}

export const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "2",
    username: "manager",
    password: "manager123",
    name: "Manager User",
    role: "manager",
  },
  {
    id: "3",
    username: "user",
    password: "user123",
    name: "Regular User",
    role: "user",
  },
]

export function authenticateUser(username: string, password: string): User | null {
  const user = mockUsers.find(
    (u) => u.username === username && u.password === password
  )
  return user || null
}

