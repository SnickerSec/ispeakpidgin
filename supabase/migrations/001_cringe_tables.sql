-- 808 Mode Cringe Generator Tables

CREATE TABLE IF NOT EXISTS cringe_greetings (
    id SERIAL PRIMARY KEY,
    gender TEXT NOT NULL CHECK (gender IN ('wahine', 'kane')),
    greeting TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cringe_payoffs (
    id SERIAL PRIMARY KEY,
    payoff TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cringe_activities (
    id SERIAL PRIMARY KEY,
    activity_key TEXT UNIQUE NOT NULL,
    activity_name TEXT NOT NULL,
    emoji TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cringe_locations (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES cringe_activities(id),
    location_key TEXT NOT NULL,
    location_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cringe_metaphors (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES cringe_locations(id),
    metaphor TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cringe_greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cringe_payoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cringe_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cringe_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cringe_metaphors ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON cringe_greetings FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cringe_payoffs FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cringe_activities FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cringe_locations FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON cringe_metaphors FOR SELECT USING (true);

-- ============================================
-- GREETINGS DATA
-- ============================================

INSERT INTO cringe_greetings (gender, greeting) VALUES
('wahine', 'Eh sistah'),
('wahine', 'Howzit beautiful'),
('wahine', 'Auwe, look at you'),
('wahine', 'Ho, excuse me miss'),
('wahine', 'Rajah dat, sistah'),
('kane', 'Eh braddah'),
('kane', 'Howzit handsome'),
('kane', 'Ho, my brah'),
('kane', 'Shoots cuz'),
('kane', 'Rajah dat, kane');

-- ============================================
-- PAYOFFS DATA
-- ============================================

INSERT INTO cringe_payoffs (payoff) VALUES
('Like go holo holo wit me?'),
('You and me, bumbye?'),
('Shoots, give me your numba?'),
('Can I take you out or what?'),
('We go cruise, yeah?'),
('What you say, one date?'),
('Let''s make memories, brah.'),
('You stay single or what?'),
('My heart stay pounding, no lie.'),
('I think I stay in love already.');

-- ============================================
-- ACTIVITIES DATA
-- ============================================

INSERT INTO cringe_activities (activity_key, activity_name, emoji) VALUES
('grindz', 'Grindz (Food)', '🍜'),
('beach', 'Beach/Ocean', '🏖️'),
('hiking', 'Hiking/Nature', '🥾');

-- ============================================
-- LOCATIONS - GRINDZ
-- ============================================

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'leonards', 'Leonard''s Bakery' FROM cringe_activities WHERE activity_key = 'grindz';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'rainbow', 'Rainbow Drive-In' FROM cringe_activities WHERE activity_key = 'grindz';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'giovannis', 'Giovanni''s Shrimp Truck' FROM cringe_activities WHERE activity_key = 'grindz';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'teds', 'Ted''s Bakery' FROM cringe_activities WHERE activity_key = 'grindz';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'zippys', 'Zippy''s' FROM cringe_activities WHERE activity_key = 'grindz';

-- ============================================
-- LOCATIONS - BEACH
-- ============================================

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'sandys', 'Sandy Beach' FROM cringe_activities WHERE activity_key = 'beach';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'pipeline', 'Pipeline' FROM cringe_activities WHERE activity_key = 'beach';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'waikiki', 'Waikiki Beach' FROM cringe_activities WHERE activity_key = 'beach';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'lanikai', 'Lanikai Beach' FROM cringe_activities WHERE activity_key = 'beach';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'hanauma', 'Hanauma Bay' FROM cringe_activities WHERE activity_key = 'beach';

-- ============================================
-- LOCATIONS - HIKING
-- ============================================

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'diamondhead', 'Diamond Head' FROM cringe_activities WHERE activity_key = 'hiking';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'kokohead', 'Koko Head Stairs' FROM cringe_activities WHERE activity_key = 'hiking';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'manoa', 'Manoa Falls' FROM cringe_activities WHERE activity_key = 'hiking';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'pillbox', 'Pillbox Hike' FROM cringe_activities WHERE activity_key = 'hiking';

INSERT INTO cringe_locations (activity_id, location_key, location_name)
SELECT id, 'stairway', 'Stairway to Heaven' FROM cringe_activities WHERE activity_key = 'hiking';

-- ============================================
-- METAPHORS - GRINDZ
-- ============================================

-- Leonard's
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you stay mo'' sweet than one fresh malasada' FROM cringe_locations WHERE location_key = 'leonards';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you hot like da malasadas coming out da fryer' FROM cringe_locations WHERE location_key = 'leonards';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d wait in dat Leonard''s line all day fo'' you' FROM cringe_locations WHERE location_key = 'leonards';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you sugar-coated my heart like one haupia malasada' FROM cringe_locations WHERE location_key = 'leonards';

-- Rainbow Drive-In
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you mo'' satisfying than da loco moco plate' FROM cringe_locations WHERE location_key = 'rainbow';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'my heart stay mixed plate—all ova da place fo'' you' FROM cringe_locations WHERE location_key = 'rainbow';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you da gravy to my rice, no can separate' FROM cringe_locations WHERE location_key = 'rainbow';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d share my last scoop rice wit you' FROM cringe_locations WHERE location_key = 'rainbow';

-- Giovanni's
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you got me hooked like Giovanni''s garlic shrimp' FROM cringe_locations WHERE location_key = 'giovannis';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you stay making my heart sizzle like dat butter' FROM cringe_locations WHERE location_key = 'giovannis';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I no care if my breath smell garlic fo'' you' FROM cringe_locations WHERE location_key = 'giovannis';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you worth da North Shore drive and da long line' FROM cringe_locations WHERE location_key = 'giovannis';

-- Ted's
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you mo'' smooth than Ted''s haupia pie' FROM cringe_locations WHERE location_key = 'teds';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you da chocolate haupia to my life' FROM cringe_locations WHERE location_key = 'teds';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'meeting you was sweeter than Ted''s coconut cream' FROM cringe_locations WHERE location_key = 'teds';

-- Zippy's
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you my comfort food, like Zippy''s at 2am' FROM cringe_locations WHERE location_key = 'zippys';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d take you to Zippy''s anytime—you worth da chili and zip pac' FROM cringe_locations WHERE location_key = 'zippys';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you got me feeling all warm inside like da saimin' FROM cringe_locations WHERE location_key = 'zippys';

-- ============================================
-- METAPHORS - BEACH
-- ============================================

-- Sandy Beach
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you hit me harder than da shorebreak at Sandys' FROM cringe_locations WHERE location_key = 'sandys';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'my heart stay getting pounded like I''m at Sandys' FROM cringe_locations WHERE location_key = 'sandys';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you dangerous and beautiful, just like Sandys' FROM cringe_locations WHERE location_key = 'sandys';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d risk da neck fo'' you, Sandys style' FROM cringe_locations WHERE location_key = 'sandys';

-- Pipeline
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you got me barreled like Pipeline in winter' FROM cringe_locations WHERE location_key = 'pipeline';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'loving you stay like dropping in at Pipe—scary but worth it' FROM cringe_locations WHERE location_key = 'pipeline';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you tube me up and spit me out every time' FROM cringe_locations WHERE location_key = 'pipeline';

-- Waikiki
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you mo'' stunning than da Waikiki sunset' FROM cringe_locations WHERE location_key = 'waikiki';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d paddle one canoe fo'' you past da reef' FROM cringe_locations WHERE location_key = 'waikiki';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you light up my life like da hotels at night' FROM cringe_locations WHERE location_key = 'waikiki';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'meeting you bettah than surfing Canoes on one good day' FROM cringe_locations WHERE location_key = 'waikiki';

-- Lanikai
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you pristine like Lanikai in da morning' FROM cringe_locations WHERE location_key = 'lanikai';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d kayak to da Mokes fo'' you any day' FROM cringe_locations WHERE location_key = 'lanikai';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you da hidden paradise, just like Lanikai' FROM cringe_locations WHERE location_key = 'lanikai';

-- Hanauma Bay
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d watch da reef video ten times fo'' you' FROM cringe_locations WHERE location_key = 'hanauma';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you colorful like da fish at Hanauma' FROM cringe_locations WHERE location_key = 'hanauma';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d pay da entrance fee every day just fo'' see you' FROM cringe_locations WHERE location_key = 'hanauma';

-- ============================================
-- METAPHORS - HIKING
-- ============================================

-- Diamond Head
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'my heart stay racing fo'' you like climbing Diamond Head' FROM cringe_locations WHERE location_key = 'diamondhead';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'da view of you bettah than da top of Diamond Head' FROM cringe_locations WHERE location_key = 'diamondhead';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d hike in da hot sun fo'' you any day' FROM cringe_locations WHERE location_key = 'diamondhead';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you da reward at da end of da trail' FROM cringe_locations WHERE location_key = 'diamondhead';

-- Koko Head
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d climb all 1,048 stairs fo'' one date wit you' FROM cringe_locations WHERE location_key = 'kokohead';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'my legs stay shaking fo'' you like afta Koko Head' FROM cringe_locations WHERE location_key = 'kokohead';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you worth da burn, just like Koko Head' FROM cringe_locations WHERE location_key = 'kokohead';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'loving you stay like Koko Head—hard but so worth it' FROM cringe_locations WHERE location_key = 'kokohead';

-- Manoa Falls
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you refreshing like Manoa Falls on one hot day' FROM cringe_locations WHERE location_key = 'manoa';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'my love fo'' you stay flowing like da waterfall' FROM cringe_locations WHERE location_key = 'manoa';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d walk through all da mud fo'' you' FROM cringe_locations WHERE location_key = 'manoa';

-- Pillbox
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'da sunrise wit you bettah than Pillbox views' FROM cringe_locations WHERE location_key = 'pillbox';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d wake up 4am fo'' hike wit you' FROM cringe_locations WHERE location_key = 'pillbox';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you got me feeling on top of da world' FROM cringe_locations WHERE location_key = 'pillbox';

-- Stairway to Heaven
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'I''d risk da ticket fo'' one hike wit you' FROM cringe_locations WHERE location_key = 'stairway';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you illegal levels of beautiful, like Haiku Stairs' FROM cringe_locations WHERE location_key = 'stairway';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'being wit you stay like heaven, no need da stairs' FROM cringe_locations WHERE location_key = 'stairway';
INSERT INTO cringe_metaphors (location_id, metaphor)
SELECT id, 'you da only stairway to heaven I need' FROM cringe_locations WHERE location_key = 'stairway';
