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
            
            return {
                select: (fields = '*') => {
                    let result = [...data];
                    if (fields && fields !== '*') {
                        const fieldList = fields.split(',').map(f => f.trim());
                        result = result.map(row => {
                            const filtered = {};
                            fieldList.forEach(f => {
                                if (f in row) filtered[f] = row[f];
                            });
                            return filtered;
                        });
                    }
                    
                    const selectChain = {
                        order: (col, opts) => {
                            const ascending = opts?.ascending !== false;
                            result.sort((a, b) => {
                                const valA = String(a[col] || '').toLowerCase();
                                const valB = String(b[col] || '').toLowerCase();
                                return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
                            });
                            return Promise.resolve({ data: result, error: null });
                        },
                        then: (onfulfilled) => Promise.resolve({ data: result, error: null }).then(onfulfilled),
                        catch: (onrejected) => Promise.resolve({ data: result, error: null }).catch(onrejected)
                    };
                    
                    return selectChain;
                },
                then: (onfulfilled) => Promise.resolve({ data, error: null }).then(onfulfilled)
            };
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
