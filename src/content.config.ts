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

const dateSchema = z
	.string()
	.or(z.date())
	.transform((value) => new Date(value))
	.refine((date) => !Number.isNaN(date.getTime()), "必须提供有效日期");

// 文章与笔记都可以是长篇内容，并共享分类、系列与发布规则。
const contentSchema = baseSchema.extend({
	description: z.string().optional(),
	draft: z.boolean().default(false),
	ogImage: z.string().optional(),
	category: z.string().default("实践记录"),
	tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
	series: z.string().optional(),
	seriesOrder: z.number().int().positive().optional(),
	publishDate: dateSchema,
	updatedDate: dateSchema.optional(),
	pinned: z.boolean().default(false),
});

const post = defineCollection({
	loader: glob({ base: "./content/posts", pattern: "**/*.{md,mdx}" }),
	schema: ({ image }) =>
		contentSchema.extend({
			description: z.string(),
			coverImage: z
				.object({
					alt: z.string(),
					src: image(),
				})
				.optional(),
		}),
});

const note = defineCollection({
	loader: glob({ base: "./content/notes", pattern: "**/*.{md,mdx}" }),
	schema: contentSchema.extend({
		category: z.string().default("速记"),
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
