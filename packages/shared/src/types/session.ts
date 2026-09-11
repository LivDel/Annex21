/** Session opaque stockée Redis (RG-10 : Redis in-EU). */
export interface SessionUser {
  id: string;
  email: string;
  role: 'owner' | 'contributor' | 'viewer';
}

export interface SessionRecord {
  id: string;
  user: SessionUser;
  createdAt: string;
  /** ISO — aligné TTL cookie 7 jours */
  expiresAt: string;
}
