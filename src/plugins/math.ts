import katex from "katex";
import type { MdastPluginDefinition } from "satteri";

function renderMath(value: string, displayMode: boolean) {
	return {
		type: "html" as const,
		value: katex.renderToString(value, {
			displayMode,
			output: "htmlAndMathml",
			strict: "warn",
			throwOnError: true,
		}),
	};
}

export function satteriKatexPlugin(): MdastPluginDefinition {
	return {
		name: "cactus-katex",
		math(node) {
			return renderMath(node.value, true);
		},
		inlineMath(node) {
			return renderMath(node.value, false);
		},
	};
}
