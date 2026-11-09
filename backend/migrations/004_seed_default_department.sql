INSERT INTO departments (name_ar)
SELECT 'دائرة الإعلام والاتصال'
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE name_ar = 'دائرة الإعلام والاتصال'
);
