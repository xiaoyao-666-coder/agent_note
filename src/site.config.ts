import type { AstroExpressiveCodeOptions } from "astro-expressive-code";
import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
	url: "https://xiaoyao-knowledge.pages.dev/",
	title: "逍遥哥的知识库",
	author: "逍遥哥",
	description: "记录技术实践、项目复盘、GitHub 笔记与长期可复用的知识。",
	lang: "zh-CN",
	ogLocale: "zh_CN",
	showLogo: true,
	date: {
		options: {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		},
	},
};

// Used to generate links in both the Header & Footer.
export const menuLinks: { path: string; title: string }[] = [
	{
		path: "/",
		title: "首页",
	},
	{
		path: "/posts/",
		title: "文章",
	},
	{
		path: "/notes/",
		title: "笔记",
	},
	{
		path: "/categories/",
		title: "分类",
	},
	{
		path: "/tags/",
		title: "标签",
	},
	{
		path: "/series/",
		title: "系列",
	},
	{
		path: "/archives/",
		title: "归档",
	},
	{
		path: "/about/",
		title: "关于",
	},
];

// https://expressive-code.com/reference/configuration/
export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
	styleOverrides: {
		borderRadius: "6px",
		codeFontFamily:
			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
		codeFontSize: "0.875rem",
		codeLineHeight: "1.7142857rem",
		codePaddingInline: "1rem",
		frames: {
			frameBoxShadowCssValue: "none",
		},
		uiLineHeight: "inherit",
	},
	themeCssSelector(theme, { styleVariants }) {
		if (styleVariants.length >= 2) {
			const baseTheme = styleVariants[0]?.theme;
			const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme;
			if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`;
		}
		return `[data-theme="${theme.name}"]`;
	},
	themes: ["dracula", "github-light"],
	useThemedScrollbars: false,
};
