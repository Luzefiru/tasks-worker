import {
	error, // creates error Responses
	json, // creates JSON Responses
	Router, // the Router itself
	withParams, // middleware to extract params into the Request itself
} from 'itty-router';
import { createClient } from '@supabase/supabase-js';

export interface Env {
	NEXT_PUBLIC_SUPABASE_URL: string;
	NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

const router = Router();

router.get('/', () => {
	return new Response('This is the Cloudflare Worker for my Todo App!');
});

router.get('/api/tasks', async (request: Request, env: Env) => {
	const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

	try {
		const { data: tasks, error } = await supabase.from('tasks').select();

		if (error) {
			console.log('Supabase error returned', error);
			throw error;
		}

		console.log('Fetched tasks successfully', tasks);

		return Response.json(tasks);
	} catch (error) {
		console.log('Catch error returned', error);
		return Response.json({ error: error });
	}
});

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all('*', () => new Response('404, not found!', { status: 404 }));

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', (e) => {
	e.respondWith(router.handle(e.request));
});

/*
Make request, env, context available to all routes as per docs: https://itty.dev/itty-router
*/
export default {
	fetch: async (request: Request, env: Env, ctx: ExecutionContext) => router.handle(request, env, ctx).then(json).catch(error),
};
