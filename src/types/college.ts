export interface College {
  /** `id`, not `_id`. */
  id: string;
  name: string;
  location?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
