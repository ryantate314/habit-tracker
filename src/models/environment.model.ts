export interface Environment {
    SECURE_ENDPOINTS: string;
    DATABASE_FILE: string;
    PORT: number | undefined;
    JWT_KEY: string;
    JWT_LIFETIME: number;
    JWT_REFRESH_KEY: string;
    JWT_REFRESH_LIFETIME: number;
    GOOGLE_CLIENT_ID: string;
    NODE_ENV: string;
}