/**
 * Creates seeded demo Auth users + profiles for assessment.
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-demo-users.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const demoUsers = [
  {
    email: "alice@draftly.demo",
    password: "DemoPass123!",
    display_name: "Alice Owner",
  },
  {
    email: "bob@draftly.demo",
    password: "DemoPass123!",
    display_name: "Bob Editor",
  },
  {
    email: "carol@draftly.demo",
    password: "DemoPass123!",
    display_name: "Carol Viewer",
  },
];

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const user of demoUsers) {
  const { data: existing } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const found = existing?.users?.find((u) => u.email === user.email);

  let userId = found?.id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { display_name: user.display_name },
    });
    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
      continue;
    }
    userId = data.user.id;
    console.log(`Created auth user ${user.email}`);
  } else {
    console.log(`Auth user already exists: ${user.email}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    email: user.email,
    display_name: user.display_name,
  });

  if (profileError) {
    console.error(`Profile upsert failed for ${user.email}:`, profileError.message);
  } else {
    console.log(`Profile ready for ${user.email}`);
  }
}

console.log("Done.");
