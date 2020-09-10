import Toggler, { Operator, Config } from "../";

const globals = {
	environment: "test",
	version: 15,
};
const features = {
	feature1: {
		conditions: [
			["environment", Operator.IN_SET, ["test", "staging"]],
			["userId", Operator.GREATER_THAN, 140],
		],
	},
	feature2: {
		conditions: [["environment", "=", "test"]],
	},
	feature3: {
		conditions: [["environment", "notIn", ["test", "staging"]]],
	},
	feature4: {
		active: true,
	},
	feature5: {
		conditions: [["environment", "unknown", "test"]],
	},
	feature6: {
		conditions: [["userId", "custom"]],
	},
	feature7: true,
};

type Globals = typeof globals;
type Features = typeof features;

const config = { globals, features } as Config<Globals, Features>;

describe("toggler", () => {
	const toggler = new Toggler<Globals, Features>(config);

	test("feature1", () => {
		expect(toggler.enabled("feature1", { userId: 150 })).toBeTruthy();
		expect(toggler.enabled("feature1", { userId: 130 })).toBeFalsy();
		expect(toggler.enabled("feature1", { userId: 150, environment: "production" })).toBeFalsy();
	});

	test("feature2", () => {
		expect(toggler.enabled("feature2", { environment: "test" })).toBeTruthy();
		expect(toggler.enabled("feature2", { environment: "production" })).toBeFalsy();
	});

	test("feature3", () => {
		expect(toggler.enabled("feature3", { environment: "test" })).toBeFalsy();
		expect(toggler.enabled("feature3", { environment: "production" })).toBeTruthy();
	});

	test("feature4", () => {
		expect(toggler.enabled("feature4")).toBeTruthy();
	});

	test("unknow operator throws error", () => {
		expect(() => toggler.enabled("feature5")).toThrow('Operator "unknown" is not registered');
	});

	test("custom operator throws error", () => {
		expect(() => toggler.enabled<{ userId: number }>("feature6", { userId: 200 })).toThrow(
			'Operator "custom" is not registered'
		);
	});

	test("custom operator evaluates", () => {
		toggler.registerOperator<number>("custom", (value, context, arg) => {
			return value === 200 && context.version === 15;
		});

		expect(toggler.enabled("feature6", { userId: 200 })).toBeTruthy();
	});

	test("boolean feature", () => {
		expect(toggler.enabled("feature7")).toBeTruthy();
	});
});
