-- private.raise_error: HTTP status in the SQLSTATE, stable code in hint.
begin;
\ir ../helpers.psql
select no_plan();

select throws_ok(
  $$select private.raise_error('NOT_ALLOWED', 'You cannot do that.', 403)$$,
  'PT403', 'You cannot do that.',
  'a 403 error becomes SQLSTATE PT403, which PostgREST returns as HTTP 403');

select is(tests.error_code($$select private.raise_error('NOT_ALLOWED', 'You cannot do that.', 403)$$),
  'NOT_ALLOWED', 'the stable code travels in hint');

select throws_ok(
  $$select private.raise_error('VALIDATION', 'Bad input.')$$,
  'PT400', 'Bad input.',
  'the status defaults to 400');

select throws_ok(
  $$select private.raise_error('WEIRD', 'Odd status.', 200)$$,
  'PT500', 'Odd status.',
  'a status outside 400-599 becomes 500');

select * from finish();
rollback;
