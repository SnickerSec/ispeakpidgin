#!/usr/bin/env node

/**
 * Unit tests for upgraded offline MockSupabaseClient / MockQueryBuilder
 */

const assert = require('assert').strict;
const { supabase } = require('../../config/supabase');

async function testQueryBuilder() {
    console.log('🧪 Testing Upgraded MockSupabaseClient / MockQueryBuilder...\n');

    // 1. Test basic select
    console.log('1. Testing basic select...');
    const selectAllRes = await supabase.from('stories').select('*');
    assert.ok(Array.isArray(selectAllRes.data));
    assert.ok(selectAllRes.data.length > 0);
    assert.strictEqual(selectAllRes.error, null);

    // 2. Test field filtering in select
    console.log('2. Testing select field filtering...');
    const selectFieldsRes = await supabase.from('stories').select('id, title');
    assert.ok(Array.isArray(selectFieldsRes.data));
    assert.ok(selectFieldsRes.data.length > 0);
    assert.ok('id' in selectFieldsRes.data[0]);
    assert.ok('title' in selectFieldsRes.data[0]);
    assert.ok(!('pidgin_text' in selectFieldsRes.data[0]));

    // 3. Test eq filter
    console.log('3. Testing eq filter...');
    const eqRes = await supabase.from('stories').select('*').eq('id', 'first_day_work');
    assert.strictEqual(eqRes.data.length, 1);
    assert.strictEqual(eqRes.data[0].id, 'first_day_work');

    // 4. Test neq filter
    console.log('4. Testing neq filter...');
    const neqRes = await supabase.from('stories').select('*').neq('id', 'first_day_work');
    assert.ok(neqRes.data.length > 0);
    assert.ok(neqRes.data.every(row => row.id !== 'first_day_work'));

    // 5. Test ilike filter
    console.log('5. Testing ilike filter...');
    const ilikeRes = await supabase.from('stories').select('*').ilike('title', '%job%');
    assert.strictEqual(ilikeRes.data.length, 1);
    assert.match(ilikeRes.data[0].title, /job/i);

    // 6. Test is filter
    console.log('6. Testing is filter...');
    // We don't have used_on in stories by default, but let's check if is behaves correctly with nulls
    const isRes = await supabase.from('stories').select('*').is('audio_example', null);
    assert.ok(Array.isArray(isRes.data));

    // 7. Test gte & lte filters
    console.log('7. Testing gte & lte filters...');
    const gteRes = await supabase.from('pickup_lines').select('*').gte('spiciness', 2);
    assert.ok(gteRes.data.every(row => row.spiciness >= 2));

    const lteRes = await supabase.from('pickup_lines').select('*').lte('spiciness', 2);
    assert.ok(lteRes.data.every(row => row.spiciness <= 2));

    // 8. Test order
    console.log('8. Testing order sorting...');
    const orderAscRes = await supabase.from('pickup_lines').select('*').order('spiciness', { ascending: true });
    for (let i = 0; i < orderAscRes.data.length - 1; i++) {
        assert.ok(orderAscRes.data[i].spiciness <= orderAscRes.data[i + 1].spiciness);
    }

    const orderDescRes = await supabase.from('pickup_lines').select('*').order('spiciness', { ascending: false });
    for (let i = 0; i < orderDescRes.data.length - 1; i++) {
        assert.ok(orderDescRes.data[i].spiciness >= orderDescRes.data[i + 1].spiciness);
    }

    // 9. Test limit
    console.log('9. Testing limit constraint...');
    const limitRes = await supabase.from('pickup_lines').select('*').limit(3);
    assert.strictEqual(limitRes.data.length, 3);

    // 10. Test single row constraints
    console.log('10. Testing single row matching...');
    const singleRes = await supabase.from('stories').select('*').eq('id', 'first_day_work').single();
    assert.ok(singleRes.data !== null);
    assert.strictEqual(typeof singleRes.data, 'object');
    assert.strictEqual(singleRes.data.id, 'first_day_work');

    const singleNotFoundRes = await supabase.from('stories').select('*').eq('id', 'nonexistent').single();
    assert.strictEqual(singleNotFoundRes.data, null);
    assert.ok(singleNotFoundRes.error !== null);
    assert.strictEqual(singleNotFoundRes.error.code, 'PGRST116');

    // 11. Test insert mutation (in-memory persistent state check)
    console.log('11. Testing insert mutation...');
    const insertData = { id: 'temp-inserted', title: 'Temporary inserted story', pidgin_text: 'Eh brah' };
    const insertRes = await supabase.from('stories').insert(insertData);
    assert.strictEqual(insertRes.error, null);

    // Verify it exists in a new query
    const verifyInsertRes = await supabase.from('stories').select('*').eq('id', 'temp-inserted').single();
    assert.ok(verifyInsertRes.data !== null);
    assert.strictEqual(verifyInsertRes.data.title, 'Temporary inserted story');

    // 12. Test update mutation
    console.log('12. Testing update mutation...');
    const updateRes = await supabase.from('stories').update({ title: 'Updated title' }).eq('id', 'temp-inserted');
    assert.strictEqual(updateRes.error, null);

    // Verify it updated in the next query
    const verifyUpdateRes = await supabase.from('stories').select('*').eq('id', 'temp-inserted').single();
    assert.strictEqual(verifyUpdateRes.data.title, 'Updated title');

    // 13. Test upsert mutation
    console.log('13. Testing upsert mutation...');
    const upsertData = { id: 'temp-inserted', title: 'Upserted title', pidgin_text: 'Upsert' };
    const upsertRes = await supabase.from('stories').upsert(upsertData);
    assert.strictEqual(upsertRes.error, null);

    const verifyUpsertRes = await supabase.from('stories').select('*').eq('id', 'temp-inserted').single();
    assert.strictEqual(verifyUpsertRes.data.title, 'Upserted title');

    // 14. Test delete mutation
    console.log('14. Testing delete mutation...');
    const deleteRes = await supabase.from('stories').delete().eq('id', 'temp-inserted');
    assert.strictEqual(deleteRes.error, null);

    // Verify it's gone
    const verifyDeleteRes = await supabase.from('stories').select('*').eq('id', 'temp-inserted').single();
    assert.strictEqual(verifyDeleteRes.data, null);
    assert.ok(verifyDeleteRes.error !== null);

    console.log('\n🎉 ALL MOCK SUPABASE CLIENT TESTS PASSED SUCCESSFULLY! 🌺\n');
}

testQueryBuilder().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
