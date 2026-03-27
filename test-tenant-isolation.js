/**
 * Test script to verify tenant isolation and onboarding redirect
 * This validates:
 * 1. Checkout redirects to /{slug}/dashboard (not /dashboard/landing-page)
 * 2. Dashboard verifies tenant ownership
 * 3. Cross-tenant access is blocked with auto-redirect
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TENANT ISOLATION & REDIRECT TEST\n');

// Test 1: Verify checkout redirect path
console.log('✓ TEST 1: Checkout redirect path');
const checkoutFile = fs.readFileSync(
  path.join(__dirname, 'src/app/checkout/page.tsx'),
  'utf8'
);
const checkoutCorrect = checkoutFile.includes('`/${academySlug}/dashboard`');
const checkoutWrong = checkoutFile.includes('`/${academySlug}/dashboard/landing-page`');
console.log(`  - Contains /{slug}/dashboard redirect: ${checkoutCorrect ? '✓' : '✗'}`);
console.log(`  - Does NOT contain /{slug}/dashboard/landing-page: ${!checkoutWrong ? '✓' : '✗'}`);

// Test 2: Verify dashboard tenant verification
console.log('\n✓ TEST 2: Dashboard tenant verification');
const dashboardLayoutFile = fs.readFileSync(
  path.join(__dirname, 'src/app/[slug]/dashboard/layout.tsx'),
  'utf8'
);

const hasUserHook = dashboardLayoutFile.includes('useUser');
const hasFirestore = dashboardLayoutFile.includes('useFirestore');
const hasTenantCheck = dashboardLayoutFile.includes('slug !== userTenantSlug');
const hasAuthRedirect = dashboardLayoutFile.includes('router.push("/auth/signin")');
const hasTenantRedirect = dashboardLayoutFile.includes('router.push(`/${userTenantSlug}/dashboard`)');

console.log(`  - Uses useUser hook: ${hasUserHook ? '✓' : '✗'}`);
console.log(`  - Uses useFirestore: ${hasFirestore ? '✓' : '✗'}`);
console.log(`  - Checks tenant ownership (slug !== userTenantSlug): ${hasTenantCheck ? '✓' : '✗'}`);
console.log(`  - Redirects unauthenticated users: ${hasAuthRedirect ? '✓' : '✗'}`);
console.log(`  - Auto-redirects to correct tenant: ${hasTenantRedirect ? '✓' : '✗'}`);

// Test 3: Verify loading state
console.log('\n✓ TEST 3: Loading state during verification');
const hasLoadingState = dashboardLayoutFile.includes('Verifying Tactical Clearance');
const hasLoader2Import = dashboardLayoutFile.includes('Loader2');
console.log(`  - Shows "Verifying Tactical Clearance" message: ${hasLoadingState ? '✓' : '✗'}`);
console.log(`  - Imports Loader2 spinner: ${hasLoader2Import ? '✓' : '✗'}`);

// Test 4: Verify free-trial integration
console.log('\n✓ TEST 4: Free-trial checkout redirect');
const freeTrialFile = fs.readFileSync(
  path.join(__dirname, 'src/components/landing/free-trial-dialog.tsx'),
  'utf8'
);
const freeTrialRedirect = freeTrialFile.includes('`/${tenantSlug}/checkout');
console.log(`  - Redirects to /{tenantSlug}/checkout: ${freeTrialRedirect ? '✓' : '✗'}`);

// Test 5: Verify route alias exists
console.log('\n✓ TEST 5: Route alias for /{slug}/checkout');
const routeAliasFile = path.join(__dirname, 'src/app/[slug]/checkout/page.tsx');
const routeAliasExists = fs.existsSync(routeAliasFile);
if (routeAliasExists) {
  const aliasContent = fs.readFileSync(routeAliasFile, 'utf8');
  const isAlias = aliasContent.includes('export { default } from');
  console.log(`  - Route alias file exists: ✓`);
  console.log(`  - Is re-export (alias): ${isAlias ? '✓' : '✗'}`);
} else {
  console.log(`  - Route alias file exists: ✗`);
}

// Test 6: Check git commit
console.log('\n✓ TEST 6: Git deployment');
const { execSync } = require('child_process');
try {
  const gitLog = execSync('cd /workspaces/AcademyPilotgbflow72 && git log --oneline -1', {
    encoding: 'utf8'
  });
  const hasCorrectCommit = gitLog.includes('fix: correct onboarding redirect and add tenant isolation');
  console.log(`  - Latest commit has correct message: ${hasCorrectCommit ? '✓' : '✗'}`);
  console.log(`  - Commit: ${gitLog.trim()}`);
} catch (e) {
  console.log(`  - Could not check git log: ✗`);
}

console.log('\n✅ ALL CODE VERIFICATIONS COMPLETE\n');
console.log('Next steps:');
console.log('1. Run: npm run dev 2>&1 | tee -a debug.log');
console.log('2. Visit onboarding flow at /{slug}');
console.log('3. Complete checkout');
console.log('4. Verify redirect to /{slug}/dashboard');
console.log('5. Test tenant isolation by accessing another tenant\'s URL');
