import { type CollectionEntry, getCollection } from "astro:content";

/** filter out draft posts based on the environment */
export async function getAllPosts(): Promise<CollectionEntry<"post">[]> {
	return await getCollection("post", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

export async function getAllNotes(): Promise<CollectionEntry<"note">[]> {
	return await getCollection("note");
}

export async function getAllSeries(): Promise<CollectionEntry<"series">[]> {
	return await getCollection("series");
}

/** Get tag metadata by tag name */
export async function getTagMeta(tag: string): Promise<CollectionEntry<"tag"> | undefined> {
	const tagEntries = await getCollection("tag", (entry) => {
		return entry.id === tag;
	});
	return tagEntries[0];
}

/** Get category metadata by category name */
export async function getCategoryMeta(
	category: string,
): Promise<CollectionEntry<"category"> | undefined> {
	const entries = await getCollection("category", (entry) => entry.id === category);
	return entries[0];
}

export async function getSeriesMeta(
	seriesId: string,
): Promise<CollectionEntry<"series"> | undefined> {
	const entries = await getCollection("series", (entry) => entry.id === seriesId);
	return entries[0];
}

/** groups posts by year using the year as the key */
export function groupPostsByYear(posts: CollectionEntry<"post">[]) {
	return Object.groupBy(posts, (post) => post.data.publishDate.getFullYear().toString());
}

/** groups content by year-month for archive views */
export function groupByYearMonth<T extends { publishDate: Date }>(items: T[]) {
	const groups = new Map<string, T[]>();
	for (const item of items) {
		const d = item.publishDate;
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		const list = groups.get(key) ?? [];
		list.push(item);
		groups.set(key, list);
	}
	return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export function getAllTags(posts: CollectionEntry<"post">[]) {
	return posts.flatMap((post) => [...post.data.tags]);
}

export function getUniqueTags(posts: CollectionEntry<"post">[]) {
	return [...new Set(getAllTags(posts))];
}

export function getUniqueTagsWithCount(posts: CollectionEntry<"post">[]): [string, number][] {
	return [
		...getAllTags(posts).reduce(
			(acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}

/** unique categories with counts from posts */
export function getUniqueCategoriesWithCount(
	posts: CollectionEntry<"post">[],
): [string, number][] {
	const map = new Map<string, number>();
	for (const post of posts) {
		const cat = post.data.category;
		map.set(cat, (map.get(cat) ?? 0) + 1);
	}
	return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
}

/** posts belonging to a series, ordered by seriesOrder then date */
export function getPostsInSeries(
	seriesId: string,
	allPosts: CollectionEntry<"post">[],
): CollectionEntry<"post">[] {
	return allPosts
		.filter((p) => p.data.series === seriesId)
		.sort((a, b) => {
			const oa = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
			const ob = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
			if (oa !== ob) return oa - ob;
			return a.data.publishDate.getTime() - b.data.publishDate.getTime();
		});
}

/** series ids used by published posts, with counts */
export function getSeriesWithCount(posts: CollectionEntry<"post">[]): [string, number][] {
	const map = new Map<string, number>();
	for (const post of posts) {
		const id = post.data.series;
		if (!id) continue;
		map.set(id, (map.get(id) ?? 0) + 1);
	}
	return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
}

export function seriesPath(seriesId: string): string {
	return `/series/${encodeURIComponent(seriesId)}/`;
}

/** related posts: same series > same category > shared tags */
export function getRelatedPosts(
	current: CollectionEntry<"post">,
	allPosts: CollectionEntry<"post">[],
	limit = 3,
): CollectionEntry<"post">[] {
	const others = allPosts.filter((p) => p.id !== current.id);

	const scored = others.map((post) => {
		let score = 0;
		if (current.data.series && post.data.series === current.data.series) score += 5;
		if (post.data.category === current.data.category) score += 3;
		const shared = post.data.tags.filter((t) => current.data.tags.includes(t)).length;
		score += shared * 2;
		return { post, score };
	});

	return scored
		.filter((s) => s.score > 0)
		.sort(
			(a, b) =>
				b.score - a.score ||
				b.post.data.publishDate.getTime() - a.post.data.publishDate.getTime(),
		)
		.slice(0, limit)
		.map((s) => s.post);
}

/** adjacent posts in chronological order (newest first list) */
export function getAdjacentPosts(
	current: CollectionEntry<"post">,
	allPosts: CollectionEntry<"post">[],
): { prev: CollectionEntry<"post"> | undefined; next: CollectionEntry<"post"> | undefined } {
	const sorted = [...allPosts].sort(
		(a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
	);
	const index = sorted.findIndex((p) => p.id === current.id);
	return {
		next: index > 0 ? sorted[index - 1] : undefined,
		prev: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined,
	};
}

/** previous / next within the same series (reading order) */
export function getAdjacentInSeries(
	current: CollectionEntry<"post">,
	seriesPosts: CollectionEntry<"post">[],
): { prev: CollectionEntry<"post"> | undefined; next: CollectionEntry<"post"> | undefined } {
	const index = seriesPosts.findIndex((p) => p.id === current.id);
	if (index < 0) return { prev: undefined, next: undefined };
	return {
		prev: index > 0 ? seriesPosts[index - 1] : undefined,
		next: index < seriesPosts.length - 1 ? seriesPosts[index + 1] : undefined,
	};
}

export function slugifyCategory(category: string): string {
	return encodeURIComponent(category);
}

export function categoryPath(category: string): string {
	return `/categories/${encodeURIComponent(category)}/`;
}
