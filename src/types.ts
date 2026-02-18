export interface User {
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
}

export interface Collaborator {
  login: string;
  avatar_url: string;
  role_name: string;
}
