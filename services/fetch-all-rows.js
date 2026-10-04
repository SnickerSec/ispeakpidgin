/**
 * Every row of a Supabase query. PostgREST caps a response at 1,000 rows, so an unpaged
 * select silently stops there -- dictionary_entries is past 790 and translation_cache past
 * 2,500. Pages are ordered by a unique column: without an ORDER BY, Postgres may return
 * rows in a different order per page, skipping some and repeating others.
 *
 * @param {object} db - Supabase client
 * @param {string} table
 * @param {string} columns - select list
 * @param {object} [opts]
 * @param {(query: object) => object} [opts.filter] - adds filters, e.g. q => q.eq('status', 'pending')
 * @param {string} [opts.orderBy] - unique column to page by (default 'id')
 * @param {number} [opts.pageSize]
 */
async function fetchAllRows(db, table, columns, { filter = q => q, orderBy = 'id', pageSize = 1000 } = {}) {
    const rows = [];
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await filter(db.from(table).select(columns))
            .order(orderBy, { ascending: true })
            .range(from, from + pageSize - 1);
        if (error) throw new Error(`${table}: ${error.message}`);
        rows.push(...(data || []));
        if (!data || data.length < pageSize) return rows;
    }
}

module.exports = { fetchAllRows };
