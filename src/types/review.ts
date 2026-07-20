export interface Review {
  id: string;
  /** Integer 1-5. */
  rating: number;
  comment: string;
  createdAt: string;
  student: {
    id: string;
    /** "First Last", or "Unknown" if the backend couldn't resolve it. */
    name: string;
    image: string | null;
  };
}

export interface CreateReviewInput {
  rating: number;
  /** Optional, max 500 chars. */
  comment?: string;
}
