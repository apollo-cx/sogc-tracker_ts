/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
export interface CompanyInfo {
    company_name: string;
    company_uid: string;
    company_cantonal_exerpt_link: string;
    search_date?: string;
}

export interface ZefixResponse {
    list?: Array<{
        name: string;
        uid: string;
        cantonalExcerptWeb: string;
        [key: string]: any;
    }>;
    [key: string]: any;
}

export interface CacheData {
    [companyName: string]: CompanyInfo | null;
}