import { ICondition, } from '@/entities/observer';
import Twig from 'twig';

export const parseSQL = (code: string, conditions: Record<string, ICondition>) => {
    const removeColumnsPattern = /columns\([^)]*\)/g;
    const twigData = code
        .replace(removeColumnsPattern, '')
        .replace(/\{\{([^}]*)\}\}/g, (match, inner) => {
            const cleaned = inner.replace(/\/\w+/g, '');
            return `{{${cleaned.trim()}}}`;
        });

    const twigRenderConditions = Object.keys(conditions).reduce((acc, condition) => {
        const value = conditions[condition].value;
        acc[condition] = value === null || value === undefined || value === ''
            ? `{{${condition}}}`
            : value;

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