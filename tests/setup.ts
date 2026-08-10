import { config } from 'dotenv';
import '@testing-library/jest-dom/vitest';

// Vitest tidak membaca .env.local sendiri. Tanpa ini, tes integrasi
// akan terlewat diam-diam karena DATABASE_URL tidak terlihat.
config({ path: '.env.local', quiet: true });
