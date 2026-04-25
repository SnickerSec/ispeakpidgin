-- Add AI flag to local_responses
ALTER TABLE public.local_responses 
ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS responder_avatar TEXT;

-- Update status check to include 'ai_suggested' if we want a separate status,
-- but keeping it 'pending' while having an AI response is also fine.
-- Let's stick to status 'pending' (human still needed) or 'ai_answered'.
ALTER TABLE public.local_questions DROP CONSTRAINT IF EXISTS local_questions_status_check;
ALTER TABLE public.local_questions ADD CONSTRAINT local_questions_status_check 
CHECK (status IN ('pending', 'answered', 'rejected', 'ai_suggested'));
