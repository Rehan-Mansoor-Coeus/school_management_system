-- pgloader imports MySQL datetimes as timestamptz with abbreviated offsets (+01).
-- Laravel/Carbon fails on model save with "Trailing data". Convert to timestamp(0).
SELECT 'ALTER TABLE ' || quote_ident(table_name)
    || ' ALTER COLUMN ' || quote_ident(column_name)
    || ' TYPE timestamp(0) without time zone USING '
    || quote_ident(column_name) || '::timestamp(0);'
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'timestamp with time zone'
ORDER BY table_name, column_name;
