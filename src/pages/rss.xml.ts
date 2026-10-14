import rss from "@astrojs/rss";
import { contentPath, getAllContent } from "@/data/post";
import { siteConfig } from "@/site.config";
import { collectionDateSort } from "@/utils/date";

export const GET = async () => {
	const content = (await getAllContent()).sort(collectionDateSort);

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: content.map((entry) => ({
			title: entry.data.title,
			description: entry.data.description,
			pubDate: entry.data.publishDate,
			link: contentPath(entry),
		})),
	});
};
