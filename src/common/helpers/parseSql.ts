import { ICondition, Column, ConditionType } from '@/entities/observer';
import Twig from 'twig';

export const getConditions = (sql: string): Record<string, ICondition> => {
	const regex = /{{(.*?)}}/g;
	const matches = sql.match(regex);
	const result: Record<string, ICondition> = {};

	matches?.forEach(match => {
		const inside = match.slice(2, -2).trim();
		const [ conditionWithOptionalType, ...params ] = inside.split(' ');

		const [ condition, type, ] = conditionWithOptionalType.split('/');
		let columns: Column[] = [];
		let required = true;

		if (params.length > 0 && params[0].startsWith('columns(')) {
			const columnsStr = params.join(' ').slice(8, -1);
			const columnsArray = columnsStr.split(',');
			columns = columnsArray.map(col => {
				const [ name, type = 'text', ] = col.split('/');
				return {
					name: name.replace(/\'/g, '').trim(),
					type: type.replace(/\'/g, '').trim() as ConditionType,
				};
			});
		}

		const findBracketsRegex = /\[(.*?)\]/g;
		const bracketMatchs = sql.match(findBracketsRegex);
		bracketMatchs?.forEach(bracketMatch => {
			if(bracketMatch.includes(match)){
				required = false;
			}
		});

		result[condition] = {
			type: columns.length > 0 ? 'sql' : type as ConditionType,
			...(columns.length > 0 ? { columns, } : {}),
			required,
			value: null,
		};
	});

	return result;
};

export const parseSQL = (code: string, conditions: Record<string, ICondition>) => {	
	const removeColumnsPattern = /columns\([^)]*\)/g;
	const removeWordsAfterSlash = /\/\w+/g;

	const twigData = code
		.replace(removeColumnsPattern, '')
		.replace(/\{\{([^}]*)\}\}/g, (match, inner) => {
			const cleaned = inner.replace(/\/\w+/g, '');
			return `{{${cleaned.trim()}}}`;
		});
		
	const twigRenderConditions = Object.keys(conditions).reduce((acc, condition) => {
		acc[condition] = !conditions[condition].value ? `{{${condition}}}` : conditions[condition].value;
		return acc;
	}, {} as Record<string, string | boolean | number | null>);
		
	const template = Twig.twig({ data: twigData, });
	const twigRendered = template.render(twigRenderConditions);
	
	const output = twigRendered.replace(/\[(.*?)\]/gs, (match, content) => {
		if (content.includes('{{')) {
			return '';
		}
		return content;
	});
		
	return output;
};