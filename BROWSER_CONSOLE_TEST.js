// ============================================================================
// COPY AND PASTE THIS INTO BROWSER CONSOLE
// Open: http://localhost:3000/admin/login → Press F12 → Console tab
// ============================================================================

console.log('🚀 Starting admin verification test...\n');

// Test 1: Check current user session
console.log('📝 Test 1: Checking current user session...');
const { data: { user }, error: userError } = await supabase.auth.getUser();
console.log('User:', user?.email, '| UID:', user?.id);
if (userError) console.error('❌ User error:', userError);
else console.log('✅ User session valid\n');

// Test 2: Query prisma_admins table
console.log('📝 Test 2: Querying prisma_admins table...');
const { data: adminData, error: adminError } = await supabase
  .from('prisma_admins')
  .select('id, email, full_name, auth_user_id, role, is_active')
  .eq('auth_user_id', user?.id)
  .eq('is_active', true)
  .single();

if (adminError) {
  console.error('❌ Admin query failed:', adminError);
  console.error('Error code:', adminError.code);
  console.error('Error message:', adminError.message);
  console.log('\n🔧 FIX: Check TEST_ADMIN_IN_CONSOLE.md for solutions');
} else {
  console.log('✅ Admin record found!');
  console.log('Admin data:', adminData);
  console.log('\n🎉 SUCCESS: You should have admin access!');
}

// Test 3: Check RLS policies
console.log('\n📝 Test 3: Testing table access...');
const { data: allAdmins, error: listError } = await supabase
  .from('prisma_admins')
  .select('email, role, is_active')
  .limit(5);

if (listError) {
  console.error('❌ List query failed (RLS may be too restrictive):', listError);
} else {
  console.log('✅ Can read prisma_admins table');
  console.log('Total admins visible:', allAdmins?.length);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log('User authenticated:', !!user);
console.log('Admin record exists:', !!adminData);
console.log('Admin access granted:', !!adminData && !adminError);
console.log('='.repeat(60));

if (!!adminData && !adminError) {
  console.log('\n✅ ALL TESTS PASSED!');
  console.log('If you still see "Acceso Denegado", try:');
  console.log('1. Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
  console.log('2. Clear cache: localStorage.clear() then reload');
  console.log('3. Check Network tab for failed requests');
} else {
  console.log('\n❌ TESTS FAILED');
  console.log('Check TEST_ADMIN_IN_CONSOLE.md for fixes');
}
