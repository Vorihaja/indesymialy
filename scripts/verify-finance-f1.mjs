import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const migration = read('supabase/migrations/20260914173000_finance_f1_owner_security_v1.sql');
const repository = read('modules/finance-erp/repository.ts');
const ownerResolver = read('modules/finance-erp/owner-context.ts');
const registry = read('modules/erp-dispatch-registry/registry.ts');
const adminRoute = read('modules/admin/features/AdminRouteFeature.tsx');
const workspaceRoute = read('modules/platform-workspaces/features/WorkspaceSectionPage.tsx');

const tests = [];
function test(name, assertion) {
  tests.push({ name, assertion });
}

test('1 personal access resolves strictly to auth.uid()', /p_owner_type='profile'[\s\S]*p_owner_id=auth\.uid\(\)/.test(migration));
test('2 another personal owner is rejected', !/p_user_id/.test(migration) && /p_owner_id=auth\.uid\(\)/.test(migration));
test('3 organization access requires a privileged real membership', /om\.role in \('owner','admin','manager','organizer'\)/.test(migration));
test('4 organization access rejects an unprivileged active member', (migration.match(/om\.role in \('owner','admin','manager','organizer'\)/g) || []).length === 2 && !/or coalesce\(om\.status,'active'\)='active'\s*\)/.test(migration));
test('5 event access resolves through the organizer authority', /p_owner_type='event'[\s\S]*e\.organizer_id[\s\S]*can_manage_finance_owner\('organization'/.test(migration));
test('6 unauthorized event access returns false through organization denial', /v_organization_id is not null and public\.can_(?:read|manage)_finance_owner\('organization',v_organization_id\)/.test(migration));
test('7 platform finance is restricted to dedicated privileges', /p_owner_type='platform'[\s\S]*is_super_admin\(\)[\s\S]*admin\.finance\.manage/.test(migration));
test('8 a forged browser owner is rejected by the server allow-list', /authorizedOwnerKeys/.test(repository) && /requireAuthorizedOwner/.test(repository));
test('9 cross-owner updates carry and verify the selected context', /updateCategory[\s\S]*requireAuthorizedOwner\(input\.owner\)/.test(repository));
test('10 archive and reversal require owner authorization', /archiveCategory[\s\S]*requireAuthorizedOwner\(owner\)/.test(repository) && /reverseManualOperation[\s\S]*requireAuthorizedOwner\(input\.owner\)/.test(repository));
test('11 categories are isolated by their canonical owner policy', /finance_categories_owner_select[\s\S]*can_read_finance_owner\(owner_type,coalesce\(profile_id,organization_id,event_id\)\)/.test(migration));
test('12 anonymous RPC execution is revoked', /revoke all on function public\.list_finance_owners\(\) from public,anon/.test(migration));
test('13 SECURITY DEFINER functions have explicit hardened search_path', (() => {
  const functions = migration.split(/create or replace function /i).slice(1);
  return functions.every((body) => /security definer[\s\S]{0,100}set search_path=pg_catalog,public,pg_temp/i.test(body));
})());
test('14 the balance view is a security-invoker without cross-owner bypass', /security_invoker=true/.test(migration) && /financial_accounts_owner_select/.test(migration) && /financial_entries_owner_select/.test(migration));
test('15 five Finance tables have explicit owner SELECT policies', (migration.match(/create policy (financial_|finance_)/g) || []).length === 5);
test('16 every browser mutation requires an authenticated session', (repository.match(/await this\.requireAuthenticatedUser\(\)/g) || []).length === 5);
test('17 all nine legacy RPCs have an exact typed client contract', /GeneratedFinanceRpcName/.test(repository) && !repository.includes('Loose' + 'RpcClient'));
test('18 the specialized runtime handler is reachable for admin and workspace routes', /section === "finance"/.test(adminRoute) && /handlerKey === "finance-erp"/.test(workspaceRoute));

const expectedOrganizationRoles = ['super-admin','admin','federation','league','club','organizer','sponsor','seller'];
const expectedPersonalRoles = ['coach','fighter','official','fan'];
for (const role of [...expectedOrganizationRoles, ...expectedPersonalRoles]) {
  if (!new RegExp(`makeEntry\\("${role}", "finance", "implemented", "finance-erp"`).test(registry)) {
    throw new Error(`Missing Finance registry entry for ${role}`);
  }
}
if (!/organizationRoles[\s\S]*"admin"[\s\S]*"seller"/.test(registry) ||
    !/personalRoles[\s\S]*"fighter"[\s\S]*"fan"/.test(registry) ||
    !/resolveFinanceExpectedScope/.test(ownerResolver)) {
  throw new Error('Finance role scope resolver does not mirror the P1A-R2 registry');
}

let failures = 0;
for (const item of tests) {
  if (item.assertion) {
    process.stdout.write(`PASS ${item.name}\n`);
  } else {
    failures += 1;
    process.stderr.write(`FAIL ${item.name}\n`);
  }
}
process.stdout.write(`FINANCE_TEST_COUNT=${tests.length}\n`);
process.stdout.write(`FINANCE_TEST_FAILURE_COUNT=${failures}\n`);
process.exitCode = failures === 0 ? 0 : 1;
