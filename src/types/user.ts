
export interface UserWithProfile {
  id: string;
  email: string | null;
  created_at: string;
  profile: {
    full_name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    is_admin: boolean | null;
    contact_type: string | null;
  } | null;
}

export interface DatabaseProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  is_admin: boolean | null;
  contact_type: string | null;
  created_at: string;
  auth_users: { email: string }[] | null;
}
