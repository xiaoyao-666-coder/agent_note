import rss from "@astrojs/rss";
import { contentPath, getAllNotes } from "@/data/post";
import { siteConfig } from "@/site.config";
import { collectionDateSort } from "@/utils/date";

export const GET = async () => {
	const notes = (await getAllNotes()).sort(collectionDateSort);

	return rss({
		title: `${siteConfig.title} · 笔记`,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: notes.map((note) => ({
			title: note.data.title,
			description: note.data.description,
			pubDate: note.data.publishDate,
			link: contentPath(note),
		})),
	});
};
