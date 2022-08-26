export interface Environment {
    SECURE_ENDPOINTS: string;
    DATABASE_FILE: string;
    PORT: number | undefined;
    JWT_KEY: string;
    GOOGLE_CLIENT_ID: string;
    ENVIRONMENT: string;
}