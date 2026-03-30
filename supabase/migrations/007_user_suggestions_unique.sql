-- Add unique constraint to pidgin in user_suggestions
ALTER TABLE user_suggestions ADD CONSTRAINT user_suggestions_pidgin_key UNIQUE (pidgin);
