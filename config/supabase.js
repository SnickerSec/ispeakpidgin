// Supabase client configuration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
let isOfflineMock = false;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing required environment variables (SUPABASE_URL, SUPABASE_ANON_KEY). Running in offline mock mode.');
    isOfflineMock = true;
    
    // Define Mock Query Builder for chainable operations
    class MockQueryBuilder {
        constructor(tableName, client, data, error = null) {
            this.tableName = tableName;
            this.client = client;
            this.data = data ? [...data] : [];
            this.error = error;
            this.isSingle = false;
            this.headOnly = false;
            this.countExact = false;
            this.updateValues = null;
            this.isDelete = false;
            this.isUpsert = false;
            this.upsertValues = null;
            this.isInsert = false;
            this.insertValues = null;
        }

        select(fields = '*', options = {}) {
            if (options.head) {
                this.headOnly = true;
            }
            if (options.count === 'exact') {
                this.countExact = true;
            }

            if (fields && fields !== '*' && !this.headOnly) {
                const fieldList = fields.split(',').map(f => f.trim());
                this.data = this.data.map(row => {
                    const filtered = {};
                    fieldList.forEach(f => {
                        if (f.includes(':')) {
                            const parts = f.split(':');
                            const alias = parts[0].trim();
                            if (alias in row) filtered[alias] = row[alias];
                        } else if (f in row) {
                            filtered[f] = row[f];
                        }
                    });
                    return filtered;
                });
            }
            return this;
        }

        eq(column, value) {
            if (this.error) return this;
            this.data = this.data.filter(row => {
                if (row[column] === undefined) return false;
                return String(row[column]) === String(value);
            });
            return this;
        }

        neq(column, value) {
            if (this.error) return this;
            this.data = this.data.filter(row => {
                if (row[column] === undefined) return true;
                return String(row[column]) !== String(value);
            });
            return this;
        }

        ilike(column, pattern) {
            if (this.error) return this;
            const regexStr = pattern
                .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
                .replace(/%/g, '.*');
            const regex = new RegExp(`^${regexStr}$`, 'i');
            this.data = this.data.filter(row => {
                if (row[column] === undefined) return false;
                return regex.test(String(row[column]));
            });
            return this;
        }

        is(column, value) {
            if (this.error) return this;
            this.data = this.data.filter(row => {
                if (value === null) {
                    return row[column] === null || row[column] === undefined;
                }
                return row[column] === value;
            });
            return this;
        }

        gte(column, value) {
            if (this.error) return this;
            this.data = this.data.filter(row => {
                if (row[column] === undefined) return false;
                return Number(row[column]) >= Number(value);
            });
            return this;
        }

        lte(column, value) {
            if (this.error) return this;
            this.data = this.data.filter(row => {
                if (row[column] === undefined) return false;
                return Number(row[column]) <= Number(value);
            });
            return this;
        }

        limit(count) {
            if (this.error) return this;
            this.data = this.data.slice(0, parseInt(count));
            return this;
        }

        order(column, options = {}) {
            if (this.error) return this;
            const ascending = options.ascending !== false;
            this.data.sort((a, b) => {
                const valA = a[column];
                const valB = b[column];
                if (valA === valB) return 0;
                if (valA === undefined || valA === null) return ascending ? -1 : 1;
                if (valB === undefined || valB === null) return ascending ? 1 : -1;
                
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return ascending ? valA - valB : valB - valA;
                }
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                return ascending ? strA.localeCompare(strB) : strB.localeCompare(strA);
            });
            return this;
        }

        single() {
            if (this.error) return this;
            this.isSingle = true;
            return this;
        }

        insert(values) {
            this.isInsert = true;
            this.insertValues = values;
            return this;
        }

        upsert(values) {
            this.isUpsert = true;
            this.upsertValues = values;
            return this;
        }

        update(values) {
            this.updateValues = values;
            return this;
        }

        delete() {
            this.isDelete = true;
            return this;
        }

        then(onfulfilled, onrejected) {
            let resultData = this.data;
            let resultError = this.error;
            let count = undefined;

            if (!resultError) {
                const mockData = this.client._loadMockData();
                if (!mockData[this.tableName]) {
                    mockData[this.tableName] = [];
                }

                if (this.isInsert && this.insertValues) {
                    const arr = Array.isArray(this.insertValues) ? this.insertValues : [this.insertValues];
                    arr.forEach(val => {
                        const insertedRow = {
                            id: val.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            created_at: new Date().toISOString(),
                            ...val
                        };
                        mockData[this.tableName].push(insertedRow);
                        this.data.push(insertedRow);
                    });
                    resultData = this.insertValues;
                } else if (this.isUpsert && this.upsertValues) {
                    const arr = Array.isArray(this.upsertValues) ? this.upsertValues : [this.upsertValues];
                    arr.forEach(val => {
                        const matchIndex = mockData[this.tableName].findIndex(row => {
                            if (val.id && row.id === val.id) return true;
                            if (val.pidgin && row.pidgin === val.pidgin) return true;
                            return false;
                        });
                        if (matchIndex > -1) {
                            mockData[this.tableName][matchIndex] = {
                                ...mockData[this.tableName][matchIndex],
                                ...val,
                                updated_at: new Date().toISOString()
                            };
                            this.data.push(mockData[this.tableName][matchIndex]);
                        } else {
                            const insertedRow = {
                                id: val.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                created_at: new Date().toISOString(),
                                ...val
                            };
                            mockData[this.tableName].push(insertedRow);
                            this.data.push(insertedRow);
                        }
                    });
                    resultData = this.upsertValues;
                } else if (this.updateValues) {
                    this.data.forEach(row => {
                        Object.assign(row, this.updateValues, { updated_at: new Date().toISOString() });
                    });
                    resultData = this.data;
                } else if (this.isDelete) {
                    const originalList = mockData[this.tableName] || [];
                    mockData[this.tableName] = originalList.filter(row => !this.data.includes(row));
                    resultData = this.data;
                }
            }

            if (this.countExact) {
                count = this.data.length;
            }

            if (this.isSingle && !resultError) {
                if (this.data.length === 0) {
                    resultData = null;
                    resultError = { code: 'PGRST116', message: 'JSON object requested, multiple or no rows returned' };
                } else {
                    resultData = this.data[0];
                }
            }

            if (this.headOnly) {
                resultData = null;
            }

            const result = { data: resultData, error: resultError };
            if (count !== undefined) {
                result.count = count;
            }

            return Promise.resolve(result).then(onfulfilled, onrejected);
        }

        catch(onrejected) {
            return this.then(null, onrejected);
        }
    }

    // Define Mock Supabase Client
    class MockSupabaseClient {
        constructor() {
            this.mockData = null;
        }

        _loadMockData() {
            if (!this.mockData) {
                try {
                    const mockPath = path.join(__dirname, '../tools/testing/mock-supabase-data.json');
                    if (fs.existsSync(mockPath)) {
                        this.mockData = JSON.parse(fs.readFileSync(mockPath, 'utf8'));
                    } else {
                        this.mockData = { dictionary_entries: [], phrases: [], stories: [] };
                    }
                } catch (e) {
                    this.mockData = { dictionary_entries: [], phrases: [], stories: [] };
                }
            }
            return this.mockData;
        }

        from(tableName) {
            const mockData = this._loadMockData();
            const data = mockData[tableName] || [];
            return new MockQueryBuilder(tableName, this, data);
        }
    }
    
    supabase = new MockSupabaseClient();
} else {
    // Create Supabase client
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            fetch: (url, options) => {
                return fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
            }
        }
    });
}

module.exports = { supabase, supabaseUrl, supabaseAnonKey, isOfflineMock };
