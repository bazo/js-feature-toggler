export enum Operator {
	IN_SET = "in",
	NOT_IN_SET = "notIn",
	EQUALS = "=",
	LESS_THAN = "<",
	GREATER_THAN = ">",
}

export type CustomOperator<V, C> = (value: V, context: Context<C>, arg: any) => boolean;

export type Params = {};

interface CustomOperators<C> {
	[key: string]: CustomOperator<any, C>;
}

type Context<C extends Params = {}> = {
	[K in keyof C]: any;
};

type Condition = [string, Operator | string, any?];

type BooleanFeature = boolean;

interface Feature {
	active?: boolean;
	conditions?: Condition[];
}

type Features<F> = {
	[K in keyof F]: Feature | BooleanFeature;
};

export interface Config<C extends Params = {}, F extends Params = {}> {
	globals?: Context<C>;
	features?: Features<F>;
}

const emptyConfig = { globals: {} as Params, features: {} as Params } as Config<Params, Params>;

export default class Toggler<C extends Params, F extends Params> {
	private globals = {} as Context<C>;
	private features = {} as Features<F>;

	private customOperators = {} as CustomOperators<C>;

	constructor(config: Config<C, F>) {
		this.globals = config?.globals || ({} as C);
		this.features = config?.features || ({} as F);
	}

	addGlobal = (property: string, value: any) => {
		this.globals[property] = value;
		return this;
	};

	enabled = <D>(feature: keyof F, data: Context<Partial<C> & D> = {} as Partial<C> & D): boolean => {
		const context = { ...this.globals, ...data };

		if (!this.features.hasOwnProperty(feature)) {
			return false;
		}

		const featureData = this.features[feature];

		if (typeof featureData === "boolean") {
			return featureData as BooleanFeature;
		} else if (featureData.hasOwnProperty("active")) {
			return (featureData as Feature).active;
		} else if (featureData.hasOwnProperty("conditions")) {
			return this.evaluateConditions((featureData as Feature).conditions, context);
		}

		return false;
	};

	private evaluateConditions = (conditions: Condition[], context: Context<C>): boolean => {
		if (conditions.length === 0) {
			return false;
		}

		for (let condition of conditions) {
			if (this.evaluateCondition(condition, context) === false) {
				return false;
			}
		}

		return true;
	};

	private evaluateCondition = (condition: Condition, context: Context<C>): boolean => {
		let field: Condition[0];
		let operator: Operator | string;
		let arg: any;

		if (condition.length === 2) {
			[field, operator] = condition;
			arg = null;
		} else {
			[field, operator, arg] = condition;
		}

		if (!context.hasOwnProperty(field)) {
			return false;
		}

		const value = context[field];

		switch (operator) {
			case Operator.EQUALS:
				return value === arg;

			case Operator.IN_SET:
				return (arg as Array<any>).includes(value);

			case Operator.NOT_IN_SET:
				return !(arg as Array<any>).includes(value);

			case Operator.GREATER_THAN:
				return value > arg;

			case Operator.LESS_THAN:
				return value < arg;

			default:
				return this.evaluateCustomOperatorCondition<typeof value, typeof arg>(operator, value, context, arg);
		}
	};

	registerOperator = <V>(sign: string, operator: CustomOperator<V, C>): void => {
		this.customOperators[sign] = operator;
	};

	private evaluateCustomOperatorCondition = <V, A>(
		operatorSign: string,
		value: V,
		context: Context<C>,
		arg: A
	): boolean => {
		if (!this.customOperators.hasOwnProperty(operatorSign)) {
			throw new Error(`Operator "${operatorSign}" is not registered`);
		}

		const operator = this.customOperators[operatorSign];
		return operator(value, context, arg);
	};
}
