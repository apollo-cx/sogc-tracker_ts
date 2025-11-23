import path from 'node:path';

// --- File Paths ---
export const DEFAULT_INPUT_FILE = path.join('data', 'companies_to_be_checked.txt');
export const DEFAULT_OUTPUT_FILE = path.join('output', 'results.csv');
export const DEFAULT_OUTPUT_NOT_FOUND_FILE = path.join('output', 'companies_not_found.txt');
export const DEFAULT_CACHE_FILE = 'cache.json';
export const DEFAULT_LOG_FILE = 'app.log';

// --- API Settings ---
export const ZEFIX_BASE_URL = "https://www.zefix.ch/ZefixREST/api/v1/firm/search.json";

// --- Other Settings ---
export const API_REQUEST_TIMEOUT = 15000; // Converted to ms (15s) - Python was 150s which is very long, adjusted to standard
export const API_REQUEST_DELAY = 5000;    // Converted to ms (5s)