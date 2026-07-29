export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface CreateReviewInput {
  rating: number;
  comment?: string;
}
