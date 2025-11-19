-- Migration: Insert Initial Badges, Challenges, and Quests

-- Insert initial badges
INSERT INTO public.partner_badges (badge_name, badge_description, badge_icon, requirement_type, requirement_value, xp_reward) VALUES
('Rookie Closer', 'Completed your first client sale', '📈', 'achievement', '{"achievement": "first_sale"}'::jsonb, 500),
('Networker', 'Referred 3 new partners', '💬', 'achievement', '{"count": 3, "type": "partner_referral"}'::jsonb, 800),
('Innovator', 'Submitted 3 automation suggestions', '⚙️', 'achievement', '{"count": 3, "type": "automation_suggestion"}'::jsonb, 1000),
('Scholar', 'Completed all quizzes', '🧠', 'achievement', '{"achievement": "all_quizzes_complete"}'::jsonb, 1200),
('Consistent', 'Maintained 8-week activity streak', '🏅', 'streak', '{"weeks": 8}'::jsonb, 1500),
('Empire Builder', 'Completed the Build Your Empire questline', '🏆', 'quest', '{"quest": "build_empire"}'::jsonb, 2000),
('Vault Elite', 'Reached Seller Pro rank', '💎', 'rank', '{"rank": "Seller Pro"}'::jsonb, 0),
('Season Champion', 'Top 10 in seasonal leaderboard', '👑', 'achievement', '{"achievement": "season_top_10"}'::jsonb, 0)
ON CONFLICT (badge_name) DO NOTHING;

-- Insert initial quest: Build Your Empire
INSERT INTO public.partner_quests (quest_name, quest_description, quest_steps, completion_reward_xp, completion_badge, completion_xp_boost, boost_duration_days, is_active) VALUES
('Build Your Empire', 'A comprehensive questline to build your partner business', '[
  {"step": 1, "task": "Add 3 clients", "xp": 500, "type": "client_count", "target": 3},
  {"step": 2, "task": "Assign 2 automations", "xp": 800, "type": "automation_assignment", "target": 2},
  {"step": 3, "task": "Close 1 deal", "xp": 1000, "type": "deal_closed", "target": 1},
  {"step": 4, "task": "Submit a case study", "xp": 1500, "type": "case_study", "target": 1}
]'::jsonb, 2000, 'Empire Builder', 1.05, 30, true)
ON CONFLICT DO NOTHING;

-- Insert sample weekly challenges (these would be rotated by admin)
INSERT INTO public.partner_challenges (challenge_type, title, description, xp_reward, active_start_date, active_end_date, is_active, requirements) VALUES
('engagement', 'Daily Login Streak', 'Log in 5 days this week', 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true, '{"type": "login_days", "target": 5}'::jsonb),
('growth', 'Client Growth', 'Add 2 new clients this week', 1000, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true, '{"type": "new_clients", "target": 2}'::jsonb),
('education', 'Knowledge Refresh', 'Complete any quiz again', 300, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true, '{"type": "quiz_completion", "target": 1}'::jsonb),
('contribution', 'Innovation Challenge', 'Suggest 1 new automation', 800, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true, '{"type": "automation_suggestion", "target": 1}'::jsonb),
('outreach', 'Outreach Master', 'Add 3 deal log entries this week', 700, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true, '{"type": "deal_entries", "target": 3}'::jsonb)
ON CONFLICT DO NOTHING;










