/**
 * Gamification Service
 * Handles XP, Levels, Ranks, and Badges
 */

let supabaseAdmin = null;

/**
 * Initialize with Supabase Admin client
 * @param {Object} client 
 */
function initialize(client) {
    supabaseAdmin = client;
}

/**
 * Award XP to a user
 * @param {string} userId - UUID of the user
 * @param {number} amount - XP amount to award
 * @param {string} actionType - Type of action (e.g., 'quiz_complete')
 * @param {string} referenceId - Optional reference ID to prevent duplicates
 * @param {Object} metadata - Optional additional data
 * @returns {Promise<Object>} - Updated user profile or null if duplicate
 */
async function awardXP(userId, amount, actionType, referenceId = null, metadata = {}) {
    if (!supabaseAdmin) throw new Error('Gamification service not initialized');

    try {
        // 1. Log to history (trigger handles rank/level updates)
        const { data: history, error: historyError } = await supabaseAdmin
            .from('user_xp_history')
            .insert({
                user_id: userId,
                xp_amount: amount,
                action_type: actionType,
                reference_id: referenceId,
                metadata
            })
            .select();

        // If unique constraint violation, it's a duplicate reward
        if (historyError && historyError.code === '23505') {
            return { status: 'duplicate', xp_awarded: 0 };
        }

        if (historyError) throw historyError;

        // 2. Update the user's total_xp
        // Trigger trigger_update_rank in migration 014 handles the rank/level logic
        const { data: profile, error: profileError } = await supabaseAdmin
            .rpc('increment_user_xp', { 
                target_user_id: userId, 
                xp_to_add: amount 
            });

        if (profileError) {
            // Fallback if RPC doesn't exist yet (migration might not have been applied or RPC missing)
            const { data: current } = await supabaseAdmin
                .from('user_profiles')
                .select('total_xp')
                .eq('id', userId)
                .single();
            
            const newXp = (current?.total_xp || 0) + amount;
            
            const { data: updated } = await supabaseAdmin
                .from('user_profiles')
                .update({ total_xp: newXp })
                .eq('id', userId)
                .select()
                .single();
                
            return { status: 'success', xp_awarded: amount, profile: updated };
        }

        return { status: 'success', xp_awarded: amount, profile };
    } catch (error) {
        console.error('Error awarding XP:', error);
        return { status: 'error', error: error.message };
    }
}

/**
 * Award a badge to a user
 * @param {string} userId 
 * @param {string} badgeId 
 * @returns {Promise<Object>}
 */
async function awardBadge(userId, badgeId) {
    if (!supabaseAdmin) throw new Error('Gamification service not initialized');

    try {
        // 1. Insert into user_badges
        const { error: badgeError } = await supabaseAdmin
            .from('user_badges')
            .insert({ user_id: userId, badge_id: badgeId });

        // If duplicate, just return
        if (badgeError && badgeError.code === '23505') {
            return { status: 'already_owned' };
        }

        if (badgeError) throw badgeError;

        // 2. Fetch badge info for XP bonus
        const { data: badge } = await supabaseAdmin
            .from('badges')
            .select('*')
            .eq('id', badgeId)
            .single();

        if (badge && badge.xp_bonus > 0) {
            await awardXP(userId, badge.xp_bonus, 'badge_award', badgeId);
        }

        return { status: 'awarded', badge };
    } catch (error) {
        console.error('Error awarding badge:', error);
        return { status: 'error', error: error.message };
    }
}

/**
 * Get user stats and badges
 * @param {string} userId 
 */
async function getUserGamification(userId) {
    if (!supabaseAdmin) throw new Error('Gamification service not initialized');

    const [profileRes, badgesRes] = await Promise.all([
        supabaseAdmin.from('user_profiles').select('total_xp, current_level, current_rank').eq('id', userId).single(),
        supabaseAdmin.from('user_badges').select('badge_id, awarded_at, badges(*)').eq('user_id', userId)
    ]);

    return {
        profile: profileRes.data,
        badges: badgesRes.data?.map(b => ({
            ...b.badges,
            awarded_at: b.awarded_at
        })) || []
    };
}

module.exports = {
    initialize,
    awardXP,
    awardBadge,
    getUserGamification
};
