UPDATE departments
   SET name_ar = regexp_replace(name_ar, '^دائرة\s*', 'قسم ')
 WHERE name_ar LIKE 'دائرة%';

UPDATE system_settings
   SET value = jsonb_set(value, '{department}', to_jsonb(regexp_replace(value->>'department', '^دائرة\s*', 'قسم ')), true),
       updated_at = now()
 WHERE key = 'institutional' AND value->>'department' LIKE 'دائرة%';

UPDATE system_settings
   SET value = jsonb_set(
         jsonb_set(value, '{assignmentTypeNames,normal}', '"مطلوب مواد للمؤسسة / جهات المانحة"'::jsonb, true),
         '{assignmentTypeNames,socialMedia}', '"سوشيال ميديا"'::jsonb, true),
       updated_at = now()
 WHERE key = 'institutional' AND value ? 'assignmentTypeNames';
