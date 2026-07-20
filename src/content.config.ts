import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

function removeDupsAndLowerCase(array: string[]) {
	return [...new Set(array.map((str) => str.toLowerCase()))];
}

const titleSchema = z.string().max(60);

const baseSchema = z.object({
	title: titleSchema,
});

const post = defineCollection({
	loader: glob({ base: "./content/posts", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		baseSchema.extend({
			description: z.string(),
			coverImage: z
				.object({
					alt: z.string(),
					src: image(),
				})
				.optional(),
			draft: z.boolean().default(false),
			ogImage: z.string().optional(),
			// 一级分类：主题导航；标签：细粒度检索
			category: z.string().default("实践记录"),
			tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
			// 系列文：与 content/series 中的 id 对应；order 为系列内顺序
			series: z.string().optional(),
			seriesOrder: z.number().optional(),
			publishDate: z
				.string()
				.or(z.date())
				.transform((val) => new Date(val)),
			updatedDate: z
				.string()
				.optional()
				.transform((str) => (str ? new Date(str) : undefined)),
			pinned: z.boolean().default(false),
		}),
});

const note = defineCollection({
	loader: glob({ base: "./content/notes", pattern: "**/*.{md,mdx}" }),
	schema: baseSchema.extend({
		description: z.string().optional(),
		category: z.string().default("速记"),
		tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
		publishDate: z.iso.datetime({ offset: true }).transform((val) => new Date(val)),
	}),
});

const tag = defineCollection({
	loader: glob({ base: "./content/tags", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: titleSchema.optional(),
		description: z.string().optional(),
	}),
});

const category = defineCollection({
	loader: glob({ base: "./content/categories", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: titleSchema.optional(),
		description: z.string().optional(),
		order: z.number().default(99),
	}),
});

const series = defineCollection({
	loader: glob({ base: "./content/series", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: titleSchema,
		description: z.string().optional(),
		order: z.number().default(99),
	}),
});

export const collections = { post, note, tag, category, series };
