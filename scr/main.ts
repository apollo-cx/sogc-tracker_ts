import fs from 'fs';
import path from 'path';
import * as config from './config';
import { logger } from './logger';
import { ZefixAPI } from './zefixSearch';
import { loadCache, saveCache } from './cacheManager';
import { CompanyInfo, CacheData } from './types';

// Utility for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function loadCompaniesToCheck(filePath: string): string[] {
    try {
        if (!fs.existsSync(filePath)) {
            logger.error("Input file '%s' not found.", filePath);
            return [];
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const companies = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (companies.length === 0) {
            logger.warning("Input file '%s' is empty.", filePath);
            return [];
        }

        logger.info("Loaded %s companies from '%s'", companies.length, filePath);
        return companies;

    } catch (e) {
        logger.error("An error occurred while reading the '%s': %s", filePath, e);
        return [];
    }
}

async function processCompanies(
    api: ZefixAPI, 
    companies: string[], 
    cacheData: CacheData
): Promise<{ newResults: CompanyInfo[], notFound: string[] }> {
    
    const newlyFoundResults: CompanyInfo[] = [];
    const companiesNotFound: string[] = [];
    const todaysDate = new Date().toISOString().split('T')[0];

    for (const companyName of companies) {
        // 1. Check cache
        if (Object.prototype.hasOwnProperty.call(cacheData, companyName)) {
            const cachedEntry = cacheData[companyName];
            if (cachedEntry === null) {
                logger.info("Cache hit (Not Found): %s", companyName);
                companiesNotFound.push(companyName);
            } else {
                logger.info("Cache hit (Found): %s", companyName);
            }
            continue;
        }

        // 2. If not in cache, query API
        logger.info("Querying API for: %s", companyName);
        let companyInfo: CompanyInfo | null = null;

        const data = await api.getCompanyData(companyName);
        
        if (data) {
            companyInfo = api.getCantonalExcerpt(data, companyName);
        }

        if (companyInfo) {
            companyInfo.search_date = todaysDate;
            newlyFoundResults.push(companyInfo);
            cacheData[companyName] = companyInfo;

            logger.info(
                "Found: %s -> %s",
                companyName,
                companyInfo.company_cantonal_exerpt_link
            );
        } else {
            companiesNotFound.push(companyName);
            cacheData[companyName] = null;
            logger.warning("Not found: %s (API error or no exact match)", companyName);
        }

        await delay(config.API_REQUEST_DELAY);
    }

    return { newResults: newlyFoundResults, notFound: companiesNotFound };
}

function saveResultsToCsv(outputFile: string, results: CompanyInfo[]) {
    if (results.length === 0) {
        logger.info("No *new* results to save.");
        return;
    }

    const fileExists = fs.existsSync(outputFile);
    const dirName = path.dirname(outputFile);

    // Ensure directory exists
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    try {
        const headers = ["search_date", "company_name", "company_uid", "company_cantonal_exerpt_link"];
        
        const csvRows = results.map(r => {
            return [
                r.search_date,
                // Handle potential commas in company names by quoting
                `"${r.company_name.replace(/"/g, '""')}"`, 
                r.company_uid,
                r.company_cantonal_exerpt_link
            ].join(',');
        });

        if (!fileExists) {
            csvRows.unshift(headers.join(','));
        }

        // Append to file (add newline at start if appending)
        const content = (fileExists ? '\n' : '') + csvRows.join('\n');
        fs.appendFileSync(outputFile, content + (fileExists ? '' : '\n'), 'utf-8');

        logger.info("Saved %s new results to '%s'", results.length, outputFile);

    } catch (e) {
        logger.error("An error occurred while writing to the output file: %s", e);
    }
}

function saveRemainingCompanies(outputFile: string, companiesNotFound: string[]) {
    const dirName = path.dirname(outputFile);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    try {
        const content = companiesNotFound.join('\n') + '\n';
        fs.writeFileSync(outputFile, content, 'utf-8');

        if (companiesNotFound.length > 0) {
            logger.info("Saved %s remaining companies to '%s'.", companiesNotFound.length, outputFile);
        } else {
            logger.info("All companies processed. No remaining companies to save.");
        }

    } catch (e) {
        logger.error("Error: Could not write remaining companies file '%s'. Error: %s", outputFile, e);
    }
}

async function main() {
    logger.info("--- Starting new SOGC conformation run ---");

    const api = new ZefixAPI();
    const cacheData = loadCache(config.DEFAULT_CACHE_FILE);

    const companiesToCheck = loadCompaniesToCheck(config.DEFAULT_INPUT_FILE);

    if (companiesToCheck.length === 0) {
        logger.warning("No companies to process. Exiting");
        return;
    }

    const { newResults, notFound } = await processCompanies(api, companiesToCheck, cacheData);

    saveResultsToCsv(config.DEFAULT_OUTPUT_FILE, newResults);
    saveCache(config.DEFAULT_CACHE_FILE, cacheData);
    saveRemainingCompanies(config.DEFAULT_OUTPUT_NOT_FOUND_FILE, notFound);

    logger.info("--- SOGC conformation run finished ---");
}

if (require.main === module) {
    main().catch(e => console.error("Fatal Error:", e));
}