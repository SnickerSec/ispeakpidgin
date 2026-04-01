const { createSlug } = require('../generators/shared-utils');
const { supabase } = require('../../config/supabase');

async function mergeDuplicates() {
    console.log('🚀 Starting duplicate merge process...');
    
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

    console.log(`📊 Found ${duplicateGroups.length} duplicate slug groups to merge.\n`);

    let totalUpdated = 0;
    let totalDeleted = 0;

    for (const [slug, group] of duplicateGroups) {
        // Sort by "completeness" to find the base entry to keep
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

        // Merge logic
        const mergedEnglish = [...new Set([...keep.english, ...others.flatMap(o => o.english)])];
        const mergedExamples = [...new Set([...keep.examples, ...others.flatMap(o => o.examples)])];
        const mergedTags = [...new Set([...(keep.tags || []), ...others.flatMap(o => o.tags || [])])];
        
        // Find the most "authentic" spelling (one with most diacritics)
        const bestPidgin = [keep, ...others].reduce((best, curr) => {
            const bestCount = (best.pidgin.match(/[āēīōū'ʻ]/g) || []).length;
            const currCount = (curr.pidgin.match(/[āēīōū'ʻ]/g) || []).length;
            return currCount > bestCount ? curr : best;
        }).pidgin;

        console.log(`🔄 Merging group "${slug}": Keeping "${keep.pidgin}" (${keep.id}), Merging ${others.length} others...`);

        const updateData = {
            pidgin: bestPidgin,
            english: mergedEnglish,
            examples: mergedExamples,
            tags: mergedTags,
            pronunciation: keep.pronunciation || others.find(o => o.pronunciation)?.pronunciation || '',
            origin: keep.origin || others.find(o => o.origin)?.origin || '',
            category: keep.category || others.find(o => o.category)?.category || 'general'
        };

        // Update the base entry
        const { error: updateError } = await supabase
            .from('dictionary_entries')
            .update(updateData)
            .eq('id', keep.id);

        if (updateError) {
            console.error(`  ❌ Failed to update ${keep.id}:`, updateError.message);
            continue;
        }
        
        totalUpdated++;

        // Delete the redundant entries
        const deleteIds = others.map(o => o.id);
        const { error: deleteError } = await supabase
            .from('dictionary_entries')
            .delete()
            .in('id', deleteIds);

        if (deleteError) {
            console.error(`  ❌ Failed to delete ${deleteIds.join(', ')}:`, deleteError.message);
        } else {
            console.log(`  ✅ Successfully updated "${bestPidgin}" and deleted duplicates.`);
            totalDeleted += deleteIds.length;
        }
    }

    console.log('\n✨ Merge Summary');
    console.log('================');
    console.log(`✅ Base entries updated: ${totalUpdated}`);
    console.log(`🗑️  Redundant entries deleted: ${totalDeleted}`);
    console.log(`\n🎉 Data cleanup complete!`);
}

mergeDuplicates().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
