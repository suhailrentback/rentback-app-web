// WEB: lib/supabase/client.ts
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabaseClient = createClientComponentClient();
export default supabaseClient;
