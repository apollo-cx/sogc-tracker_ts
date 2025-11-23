import { ZEFIX_BASE_URL } from './config';
import { logger } from './logger';
import type { CompanyInfo, ZefixResponse } from './types';

export class ZefixAPI {
    private baseUrl: string;

    constructor(baseUrl: string = ZEFIX_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async getCompanyData(companyName: string): Promise<ZefixResponse | null> {
        try {
            const headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
                "Origin": "https://www.zefix.ch",
            };

            const payload = {
                "name": companyName,
                "languageKey": "en",
                "maxEntries": 50,
                "offset": 0,
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                // Node native fetch doesn't support timeout directly in options in older versions, 
                // but usually handles it via AbortController. Omitting for simplicity here.
            });

            if (response.ok) {
                return await response.json() as ZefixResponse;
            }

            if (response.status === 404) {
                logger.info("Company not found via API (404): %s", companyName);
                return null;
            }

            const text = await response.text();
            logger.error(
                "API request failed with status code %s for company %s. Response: %s",
                response.status,
                companyName,
                text
            );
            return null;

        } catch (e) {
            logger.error("An error during the API request occurred: %s", e);
            return null;
        }
    }

    getCantonalExcerpt(data: ZefixResponse, originalSearchTerm: string): CompanyInfo | null {
        if (!data || !data.list) {
            return null;
        }

        for (const company of data.list) {
            try {
                const resultName = company.name;

                // Case insensitive comparison
                if (originalSearchTerm.toLowerCase() === resultName.toLowerCase()) {
                    return {
                        company_name: company.name,
                        company_uid: company.uid,
                        company_cantonal_exerpt_link: company.cantonalExcerptWeb
                    };
                }
            } catch (e) {
                logger.warning("Error parsing company data: %s", e);
                return null;
            }
        }

        return null;
    }
}