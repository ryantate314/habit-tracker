export interface User {
    id: string;
    email: string;
    identities: UserIdentity[]
}

export interface UserIdentity {
    id: string;
    provider: "google";
}