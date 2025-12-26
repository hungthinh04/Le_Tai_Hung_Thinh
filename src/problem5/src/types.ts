export interface Resource {
  id?: number;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateResourceDto {
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateResourceDto {
  name?: string;
  description?: string;
  status?: string;
}

export interface FilterQuery {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

