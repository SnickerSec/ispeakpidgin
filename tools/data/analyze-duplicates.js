const { createSlug } = require('../generators/shared-utils');
const { supabase } = require('../../config/supabase');

async function analyzeDuplicates() {
    console.log('🔍 Analyzing duplicate slug groups in Supabase...');
    
    const { data: entries, error } = await supabase
        .from('dictionary_entries')
        .select('*')
        .order('pidgin', { ascending: true });

    if (error) {
        console.error('❌ Error fetching entries:', error.message);
        return;
    }

    const slugGroups = {};
    entries.forEach(entry => {
        const slug = createSlug(entry.pidgin);
        if (!slugGroups[slug]) slugGroups[slug] = [];
        slugGroups[slug].push(entry);
    });

    const duplicateGroups = Object.entries(slugGroups)
        .filter(([slug, group]) => group.length > 1);

    console.log(`📊 Found ${duplicateGroups.length} duplicate slug groups.\n`);

    const mergePlan = [];

    duplicateGroups.forEach(([slug, group]) => {
        console.log(`📁 Group: "${slug}" (${group.length} entries)`);
        
        // Sort by "completeness"
        // Criteria: number of English meanings, existence of pronunciation, number of examples
        const sorted = [...group].sort((a, b) => {
            const scoreA = (a.english?.length || 0) * 2 + 
                          (a.pronunciation ? 1 : 0) + 
                          (a.examples?.length || 0) +
                          (a.origin ? 1 : 0) +
                          (a.frequency === 'high' ? 2 : 1);
            
            const scoreB = (b.english?.length || 0) * 2 + 
                          (b.pronunciation ? 1 : 0) + 
                          (b.examples?.length || 0) +
                          (b.origin ? 1 : 0) +
                          (b.frequency === 'high' ? 2 : 1);
            
            return scoreB - scoreA;
        });

        const keep = sorted[0];
        const others = sorted.slice(1);

        console.log(`   ✅ KEEP:   "${keep.pidgin}" (ID: ${keep.id}) [Score: ${score(keep)}]`);
        others.forEach(other => {
            console.log(`   ❌ DELETE: "${other.pidgin}" (ID: ${other.id}) [Score: ${score(other)}]`);
        });

        // Prepare merge data
        const mergedEnglish = [...new Set([...keep.english, ...others.flatMap(o => o.english)])];
        const mergedExamples = [...new Set([...keep.examples, ...others.flatMap(o => o.examples)])];
        const mergedTags = [...new Set([...(keep.tags || []), ...others.flatMap(o => o.tags || [])])];
        
        // Prefer the version with diacritics for the display name if possible
        // (Usually the one with more special characters is the "correct" Hawaiian spelling)
        const bestPidgin = [keep, ...others].reduce((best, curr) => {
            const bestCount = (best.pidgin.match(/[āēīōū'ʻ]/g) || []).length;
            const currCount = (curr.pidgin.match(/[āēīōū'ʻ]/g) || []).length;
            return currCount > bestCount ? curr : best;
        }).pidgin;

        mergePlan.push({
            keepId: keep.id,
            updateData: {
                pidgin: bestPidgin,
                english: mergedEnglish,
                examples: mergedExamples,
                tags: mergedTags,
                pronunciation: keep.pronunciation || others.find(o => o.pronunciation)?.pronunciation || '',
                origin: keep.origin || others.find(o => o.origin)?.origin || '',
                category: keep.category || others.find(o => o.category)?.category || 'general'
            },
            deleteIds: others.map(o => o.id)
        });
        console.log('');
    });

    return mergePlan;
}

function score(entry) {
    return (entry.english?.length || 0) * 2 + 
           (entry.pronunciation ? 1 : 0) + 
           (entry.examples?.length || 0) +
           (entry.origin ? 1 : 0) +
           (entry.frequency === 'high' ? 2 : 1);
}

analyzeDuplicates();
