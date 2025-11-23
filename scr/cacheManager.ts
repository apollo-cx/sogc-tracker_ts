import fs from 'fs';
import { CacheData } from './types';
import { logger } from './logger';

export function loadCache(cacheFile: string): CacheData {
    if (!fs.existsSync(cacheFile)) {
        logger.info("No cache file found at '%s'. Starting fresh.", cacheFile);
        return {};
    }

    try {
        const data = fs.readFileSync(cacheFile, 'utf-8');
        const cache = JSON.parse(data);
        logger.info("Cache loaded from '%s'", cacheFile);
        return cache;
    } catch (e) {
        logger.error("Could not load cache from '%s'. Starting with an empty cache Error: %s", cacheFile, e);
        return {};
    }
}

export function saveCache(cacheFile: string, cacheData: CacheData): void {
    try {
        fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 4), 'utf-8');
        logger.info("Cache saved to '%s'", cacheFile);
    } catch (e) {
        logger.error("Could not save cache to '%s'. Error: %s", cacheFile, e);
    }
}