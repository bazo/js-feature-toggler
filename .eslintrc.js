module.exports = {
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 2020,
		sourceType: "module",
	},
	env: {
		browser: true,
		es6: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended",
		"prettier/@typescript-eslint",
		"prettier/standard",
	],
	settings: {
		react: {
			version: "detect",
		},
	},
	plugins: ["@typescript-eslint", "prettier", "jest"],
};
