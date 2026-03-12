import { db } from '@/index';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import * as schema from '@/src/db/schema';
import * as relations from '@/src/db/relations';
import * as authSchema from '@/src/db/auth-schema';
import { supabase } from '@/lib/supabase';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			...authSchema, // includes user, session, account, verification
			...schema,
			...relations,
		},
	}),
	user: {
		deleteUser: {
			enabled: true,
			afterDelete: async (user) => {
				const { data: files } = await supabase.storage
					.from(user.id)
					.list();

				if (files && files.length > 0) {
					await supabase.storage
						.from(user.id)
						.remove(files.map((f) => f.name));
				}

				await supabase.storage.deleteBucket(user.id);
			},
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['github', 'google'],
		},
	},
	trustedOrigins: [
		'http://localhost:3000',
		'https://paper-to-code.vercel.app',
	],
});
